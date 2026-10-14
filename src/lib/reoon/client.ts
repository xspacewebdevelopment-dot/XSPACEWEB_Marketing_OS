import { normalizeEmail } from "@/lib/utils";
import {
  NormalizedBulkTaskProgress,
  NormalizedVerificationDetails,
  NormalizedVerificationStatus,
  ProviderCreditBalance,
  ReoonBalanceApiResponse,
  ReoonBulkTaskResultResponse,
  ReoonConfigStatus,
  ReoonCreateBulkResponse,
  ReoonRawVerifyResponse,
  VerificationDepth,
} from "./types";

import dotenv from "dotenv";

if (!process.env.REOON_API_KEY) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const REOON_BASE_URL = "https://emailverifier.reoon.com/api/v1";
const DEFAULT_TIMEOUT_MS = 15000;
const BALANCE_CACHE_TTL_MS = 300000; // 5 minutes cache to keep dashboard loads fast

export class ReoonProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ReoonProviderError";
  }
}

let cachedBalance: { data: ProviderCreditBalance; expiresAt: number } | null = null;

export class ReoonClient {
  private get apiKey(): string | null {
    return process.env.REOON_API_KEY?.trim() || null;
  }

  constructor() {}

  public getConfigStatus(): ReoonConfigStatus {
    const hasApiKey = Boolean(this.apiKey && this.apiKey.length > 5);
    return {
      isConfigured: hasApiKey,
      provider: "REOON",
      hasApiKey,
      readyForPhase2: true,
      readyForPhase3: true,
    };
  }

  /**
   * Accurate status normalization for Power and Quick modes against real Reoon responses.
   */
  public normalizeStatus(
    raw: ReoonRawVerifyResponse,
    mode: VerificationDepth
  ): {
    status: NormalizedVerificationStatus;
    hasConflictingSignals: boolean;
    reason: string | null;
  } {
    const rawStatus = (raw.status || "").toLowerCase().trim();

    if (mode === "POWER") {
      switch (rawStatus) {
        case "safe":
        case "valid": {
          const hasNegativeDelivery =
            raw.is_deliverable === false ||
            raw.is_disabled === true ||
            raw.is_spamtrap === true ||
            raw.is_disposable === true ||
            raw.is_valid_syntax === false;

          if (hasNegativeDelivery) {
            return {
              status: "RISKY",
              hasConflictingSignals: true,
              reason:
                raw.reason ||
                "Provider returned safe status but flagged conflicting negative deliverability or security attributes",
            };
          }

          return {
            status: "VALID",
            hasConflictingSignals: false,
            reason: raw.reason || "Mailbox confirmed active and deliverable via deep SMTP handshake",
          };
        }

        case "invalid":
          return {
            status: "INVALID",
            hasConflictingSignals: false,
            reason: raw.reason || "Target mailbox does not exist (hard bounce)",
          };

        case "disabled":
          return {
            status: "INVALID",
            hasConflictingSignals: false,
            reason: raw.reason || "Mailbox is disabled by target mail provider",
          };

        case "disposable":
          return {
            status: "RISKY",
            hasConflictingSignals: false,
            reason: raw.reason || "Temporary disposable email address domain",
          };

        case "inbox_full":
          return {
            status: "RISKY",
            hasConflictingSignals: false,
            reason: raw.reason || "Target mailbox storage quota is full",
          };

        case "catch_all":
        case "catch-all":
          return {
            status: "RISKY",
            hasConflictingSignals: false,
            reason: raw.reason || "Domain mail server accepts all incoming mail (catch-all configuration)",
          };

        case "role_account":
        case "role":
          return {
            status: "RISKY",
            hasConflictingSignals: false,
            reason: raw.reason || "Role-based departmental or shared mailbox address",
          };

        case "spamtrap":
          return {
            status: "RISKY",
            hasConflictingSignals: false,
            reason: raw.reason || "Target address identified as a spam trap or reputation hazard",
          };

        case "unknown":
          return {
            status: "UNKNOWN",
            hasConflictingSignals: false,
            reason: raw.reason || "Mail server connection timed out or did not return definitive SMTP response",
          };

        default:
          return {
            status: "UNKNOWN",
            hasConflictingSignals: Boolean(rawStatus),
            reason: raw.reason || `Undocumented provider status: ${raw.status || "unspecified"}`,
          };
      }
    } else {
      // QUICK MODE: strictly preliminary checks (syntax & domain/MX).
      switch (rawStatus) {
        case "safe":
        case "valid":
          return {
            status: "VALID",
            hasConflictingSignals: false,
            reason:
              raw.reason ||
              "Preliminary syntax & domain check passed (Mailbox delivery not tested in Quick mode)",
          };
        case "invalid":
          return {
            status: "INVALID",
            hasConflictingSignals: false,
            reason: raw.reason || "Domain or email syntax is invalid",
          };
        case "disposable":
          return {
            status: "RISKY",
            hasConflictingSignals: false,
            reason: raw.reason || "Disposable temporary domain detected",
          };
        case "role_account":
        case "role":
          return {
            status: "RISKY",
            hasConflictingSignals: false,
            reason: raw.reason || "Role-based group address detected",
          };
        case "spamtrap":
          return {
            status: "RISKY",
            hasConflictingSignals: false,
            reason: raw.reason || "Known spam-trap domain pattern",
          };
        default:
          return {
            status: "UNKNOWN",
            hasConflictingSignals: false,
            reason: raw.reason || "Preliminary check returned indeterminate status",
          };
      }
    }
  }

  /**
   * Executes live real email verification exclusively against the official Reoon API.
   * Credentials and full URLs containing the API key are NEVER logged.
   */
  public async verifySingle(
    email: string,
    mode: VerificationDepth = "POWER"
  ): Promise<NormalizedVerificationDetails> {
    const trimmed = email.trim();
    const normalized = normalizeEmail(trimmed);

    if (!this.apiKey) {
      throw new ReoonProviderError(
        "REOON_API_KEY environment variable is not configured on the server",
        500,
        "CONFIG_MISSING"
      );
    }

    const apiModeParam = mode === "POWER" ? "power" : "quick";
    const url = `${REOON_BASE_URL}/verify?email=${encodeURIComponent(normalized)}&key=${encodeURIComponent(
      this.apiKey
    )}&mode=${apiModeParam}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new ReoonProviderError(
          "Reoon verification request timed out after 25 seconds",
          504,
          "TIMEOUT"
        );
      }
      throw new ReoonProviderError(
        `Unable to connect to Reoon Email Verifier: ${err instanceof Error ? err.message : "Network error"}`,
        502,
        "NETWORK_ERROR"
      );
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ReoonProviderError("Invalid or unauthorized Reoon API key", 401, "UNAUTHORIZED");
      }
      if (response.status === 429) {
        throw new ReoonProviderError(
          "Reoon API rate limit reached. Please wait a moment before trying again.",
          429,
          "RATE_LIMITED"
        );
      }
      throw new ReoonProviderError(
        `Reoon API returned HTTP status ${response.status}`,
        response.status,
        "PROVIDER_ERROR"
      );
    }

    let data: ReoonRawVerifyResponse;
    try {
      data = (await response.json()) as ReoonRawVerifyResponse;
    } catch {
      throw new ReoonProviderError(
        "Reoon API returned an invalid non-JSON response",
        502,
        "INVALID_JSON"
      );
    }

    // Check for provider-reported errors even on HTTP 200
    if (
      data.status === "error" ||
      data.api_status === "error" ||
      data.status === "insufficient_credits"
    ) {
      const msg = data.message || data.reason || "Reoon reported an error processing verification";
      const isCreditIssue =
        data.status === "insufficient_credits" ||
        msg.toLowerCase().includes("credit") ||
        msg.toLowerCase().includes("balance");

      throw new ReoonProviderError(
        msg,
        isCreditIssue ? 402 : 400,
        isCreditIssue ? "INSUFFICIENT_CREDITS" : "PROVIDER_REJECTED"
      );
    }

    const norm = this.normalizeStatus(data, mode);
    const domain = data.domain || normalized.split("@")[1] || null;

    // Invalidate cached balance so next balance check reflects consumed credit
    cachedBalance = null;

    return {
      email: trimmed,
      normalizedEmail: normalized,
      status: norm.status,
      verificationMode: mode,
      provider: "REOON",
      providerStatus: data.status || "unknown",
      providerSubstatus: data.sub_status || data.substatus || null,
      reason: norm.reason || data.reason || null,
      overallScore: typeof data.overall_score === "number" ? data.overall_score : typeof data.score === "number" ? data.score : null,
      isValidSyntax: data.is_valid_syntax ?? true,
      isDisposable: Boolean(data.is_disposable),
      isRoleBased: Boolean(data.is_role_account),
      isCatchAll: Boolean(data.is_catch_all),
      mxAcceptsMail: data.mx_accepts_mail ?? null,
      canConnectSmtp: mode === "POWER" ? (data.can_connect_smtp ?? null) : null,
      isDeliverable: mode === "POWER" ? (data.is_deliverable ?? null) : null,
      isSpamtrap: Boolean(data.is_spamtrap),
      isDisabled: Boolean(data.is_disabled),
      hasInboxFull: Boolean(data.has_inbox_full),
      isFreeEmail: Boolean(data.is_free_email),
      domain,
      mxRecords: Array.isArray(data.mx_records) ? data.mx_records : [],
      rawResponse: data,
      verifiedAt: new Date().toISOString(),
      hasConflictingSignals: norm.hasConflictingSignals,
      notice:
        mode === "QUICK"
          ? "Quick Check verifies syntax, domain, and disposable status only. It does not verify individual mailbox deliverability."
          : undefined,
    };
  }

  /**
   * Retrieves real account credit balance directly from the Reoon API.
   * Implements in-memory TTL caching and redacts API key from logs.
   */
  public async getAccountBalance(forceRefresh = false): Promise<ProviderCreditBalance> {
    const now = Date.now();

    if (!forceRefresh && cachedBalance && cachedBalance.expiresAt > now) {
      return cachedBalance.data;
    }

    if (!this.apiKey) {
      const missingKeyBalance: ProviderCreditBalance = {
        dailyCreditsRemaining: null,
        instantCreditsRemaining: null,
        totalCreditsRemaining: null,
        status: "unavailable",
        message: "REOON_API_KEY is not configured",
        lastRefreshedAt: new Date().toISOString(),
        hasApiKey: false,
      };
      return missingKeyBalance;
    }

    const url = `${REOON_BASE_URL}/check-account-balance/?key=${encodeURIComponent(this.apiKey)}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as ReoonBalanceApiResponse;

      if (data.status === "error" || data.api_status === "error") {
        throw new Error(data.message || "Provider returned error status");
      }

      const daily = typeof data.remaining_daily_credits === "number" ? data.remaining_daily_credits : null;
      const instant = typeof data.remaining_instant_credits === "number" ? data.remaining_instant_credits : null;
      const total = (daily || 0) + (instant || 0);

      const balance: ProviderCreditBalance = {
        dailyCreditsRemaining: daily,
        instantCreditsRemaining: instant,
        totalCreditsRemaining: total,
        status: total > 0 ? "active" : "insufficient",
        message: total > 0 ? "Credits available" : "Account has 0 remaining credits",
        lastRefreshedAt: new Date().toISOString(),
        hasApiKey: true,
      };

      cachedBalance = { data: balance, expiresAt: now + BALANCE_CACHE_TTL_MS };
      return balance;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      const fallback: ProviderCreditBalance = {
        dailyCreditsRemaining: null,
        instantCreditsRemaining: null,
        totalCreditsRemaining: null,
        status: "unavailable",
        message: `Provider unreachable (${message})`,
        lastRefreshedAt: new Date().toISOString(),
        hasApiKey: true,
      };
      return fallback;
    }
  }

  /**
   * Submits a list of emails to Reoon bulk verification API:
   * POST https://emailverifier.reoon.com/api/v1/create-bulk-verification-task/
   * Reoon automatically removes duplicates and malformed addresses, then returns a task_id.
   * Maximum 50,000 emails per task.
   */
  public async createBulkTask(
    emails: string[],
    name?: string
  ): Promise<ReoonCreateBulkResponse> {
    if (!this.apiKey) {
      throw new ReoonProviderError(
        "REOON_API_KEY environment variable is not configured on the server",
        500,
        "CONFIG_MISSING"
      );
    }

    if (!emails || emails.length === 0) {
      throw new ReoonProviderError("At least one email address is required for bulk verification", 400, "EMPTY_LIST");
    }

    if (emails.length > 50000) {
      throw new ReoonProviderError(
        "Reoon bulk verification supports a maximum of 50,000 emails per task",
        400,
        "LIMIT_EXCEEDED"
      );
    }

    const payload = {
      key: this.apiKey,
      emails,
      name: (name || "bulk_verification").slice(0, 25),
    };

    const url = `${REOON_BASE_URL}/create-bulk-verification-task/`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS * 2), // 30s timeout for bulk submit
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new ReoonProviderError(
          "Reoon bulk task creation request timed out after 30 seconds",
          504,
          "TIMEOUT"
        );
      }
      throw new ReoonProviderError(
        `Unable to connect to Reoon Bulk API: ${err instanceof Error ? err.message : "Network error"}`,
        502,
        "NETWORK_ERROR"
      );
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ReoonProviderError("Invalid or unauthorized Reoon API key", 401, "UNAUTHORIZED");
      }
      if (response.status === 429) {
        throw new ReoonProviderError(
          "Reoon API rate limit reached. Please wait before creating another bulk task.",
          429,
          "RATE_LIMITED"
        );
      }
      throw new ReoonProviderError(
        `Reoon API returned HTTP status ${response.status}`,
        response.status,
        "PROVIDER_ERROR"
      );
    }

    let data: ReoonCreateBulkResponse;
    try {
      data = (await response.json()) as ReoonCreateBulkResponse;
    } catch {
      throw new ReoonProviderError(
        "Reoon API returned an invalid non-JSON response during bulk task creation",
        502,
        "INVALID_JSON"
      );
    }

    if (data.status === "error") {
      const msg = data.reason || data.message || "Failed to create Reoon bulk verification task";
      const isCreditIssue =
        msg.toLowerCase().includes("credit") || msg.toLowerCase().includes("balance");

      throw new ReoonProviderError(
        msg,
        isCreditIssue ? 402 : 400,
        isCreditIssue ? "INSUFFICIENT_CREDITS" : "PROVIDER_REJECTED"
      );
    }

    // Invalidate cached balance since credits will be reserved/consumed
    cachedBalance = null;

    return data;
  }

  /**
   * Polls the Reoon bulk verification endpoint for status and itemized results:
   * GET https://emailverifier.reoon.com/api/v1/get-result-bulk-verification-task/?key=KEY&task_id=TASK_ID
   */
  public async getBulkTaskProgress(
    taskId: string | number
  ): Promise<NormalizedBulkTaskProgress> {
    if (!this.apiKey) {
      throw new ReoonProviderError(
        "REOON_API_KEY environment variable is not configured on the server",
        500,
        "CONFIG_MISSING"
      );
    }

    const taskIdStr = String(taskId).trim();
    if (!taskIdStr) {
      throw new ReoonProviderError("Valid task_id is required", 400, "INVALID_TASK_ID");
    }

    const url = `${REOON_BASE_URL}/get-result-bulk-verification-task/?key=${encodeURIComponent(
      this.apiKey
    )}&task_id=${encodeURIComponent(taskIdStr)}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new ReoonProviderError(
          "Reoon bulk task status query timed out",
          504,
          "TIMEOUT"
        );
      }
      throw new ReoonProviderError(
        `Unable to check Reoon bulk task status: ${err instanceof Error ? err.message : "Network error"}`,
        502,
        "NETWORK_ERROR"
      );
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ReoonProviderError("Invalid or unauthorized Reoon API key", 401, "UNAUTHORIZED");
      }
      if (response.status === 429) {
        throw new ReoonProviderError(
          "Reoon API rate limit reached during status check. Will retry shortly.",
          429,
          "RATE_LIMITED"
        );
      }
      throw new ReoonProviderError(
        `Reoon API returned HTTP status ${response.status}`,
        response.status,
        "PROVIDER_ERROR"
      );
    }

    let data: ReoonBulkTaskResultResponse;
    try {
      data = (await response.json()) as ReoonBulkTaskResultResponse;
    } catch {
      throw new ReoonProviderError(
        "Reoon API returned an invalid non-JSON response during status poll",
        502,
        "INVALID_JSON"
      );
    }

    const rawStatus = (data.status || "").toLowerCase().trim();

    if (rawStatus === "error" || rawStatus === "file_not_found" || rawStatus === "file_loading_error") {
      return {
        taskId: taskIdStr,
        status: "FAILED",
        rawProviderStatus: data.status,
        countTotal: data.count_total || 0,
        countProcessed: data.count_checked || 0,
        progressPercentage: typeof data.progress_percentage === "number" ? data.progress_percentage : 0,
        isFinished: true,
        error: data.reason || data.message || `Provider returned status: ${data.status}`,
      };
    }

    if (rawStatus === "waiting") {
      return {
        taskId: taskIdStr,
        status: "PENDING",
        rawProviderStatus: data.status,
        countTotal: data.count_total || 0,
        countProcessed: data.count_checked || 0,
        progressPercentage: typeof data.progress_percentage === "number" ? data.progress_percentage : 0,
        isFinished: false,
      };
    }

    if (rawStatus === "running") {
      return {
        taskId: taskIdStr,
        status: "PROCESSING",
        rawProviderStatus: data.status,
        countTotal: data.count_total || 0,
        countProcessed: data.count_checked || 0,
        progressPercentage: typeof data.progress_percentage === "number" ? data.progress_percentage : 0,
        isFinished: false,
      };
    }

    if (rawStatus === "completed") {
      // Invalidate balance cache since credits have been deducted
      cachedBalance = null;

      const rawResults = data.results || {};
      const entries: ReoonRawVerifyResponse[] = Array.isArray(rawResults)
        ? rawResults
        : Object.values(rawResults);

      const normalizedResults: NormalizedVerificationDetails[] = entries.map((rawItem) => {
        const itemEmail = rawItem.email || "";
        const itemNormalized = normalizeEmail(itemEmail);
        const norm = this.normalizeStatus(rawItem, "POWER");
        const domain = rawItem.domain || itemNormalized.split("@")[1] || null;

        return {
          email: itemEmail,
          normalizedEmail: itemNormalized,
          status: norm.status,
          verificationMode: "POWER",
          provider: "REOON",
          providerStatus: rawItem.status || "unknown",
          providerSubstatus: rawItem.sub_status || rawItem.substatus || null,
          reason: norm.reason || rawItem.reason || null,
          overallScore:
            typeof rawItem.overall_score === "number"
              ? rawItem.overall_score
              : typeof rawItem.score === "number"
              ? rawItem.score
              : null,
          isValidSyntax: rawItem.is_valid_syntax ?? true,
          isDisposable: Boolean(rawItem.is_disposable),
          isRoleBased: Boolean(rawItem.is_role_account),
          isCatchAll: Boolean(rawItem.is_catch_all),
          mxAcceptsMail: rawItem.mx_accepts_mail ?? null,
          canConnectSmtp: rawItem.can_connect_smtp ?? null,
          isDeliverable: rawItem.is_deliverable ?? null,
          isSpamtrap: Boolean(rawItem.is_spamtrap),
          isDisabled: Boolean(rawItem.is_disabled),
          hasInboxFull: Boolean(rawItem.has_inbox_full),
          isFreeEmail: Boolean(rawItem.is_free_email),
          domain,
          mxRecords: Array.isArray(rawItem.mx_records)
            ? rawItem.mx_records
            : rawItem.mx_record
            ? [String(rawItem.mx_record)]
            : [],
          rawResponse: rawItem as Record<string, unknown>,
          verifiedAt: new Date().toISOString(),
          hasConflictingSignals: norm.hasConflictingSignals,
        };
      });

      return {
        taskId: taskIdStr,
        status: "COMPLETED",
        rawProviderStatus: data.status,
        countTotal: data.count_total || normalizedResults.length,
        countProcessed: data.count_checked || normalizedResults.length,
        progressPercentage: 100,
        isFinished: true,
        results: normalizedResults,
      };
    }

    // Fallback for undocumented provider statuses
    return {
      taskId: taskIdStr,
      status: "PROCESSING",
      rawProviderStatus: data.status || "unknown",
      countTotal: data.count_total || 0,
      countProcessed: data.count_checked || 0,
      progressPercentage: typeof data.progress_percentage === "number" ? data.progress_percentage : 0,
      isFinished: false,
    };
  }

  public clearBalanceCache(): void {
    cachedBalance = null;
  }
}

export const reoonClient = new ReoonClient();
