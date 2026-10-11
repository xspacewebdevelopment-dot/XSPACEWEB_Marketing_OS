import { normalizeEmail } from "@/lib/utils";
import {
  NormalizedVerificationStatus,
  NormalizedVerifyResult,
  ReoonAccountBalanceResponse,
  ReoonApiMode,
  ReoonConfigStatus,
  ReoonRawStatus,
  ReoonVerificationMode,
} from "./types";

const REOON_BASE_URL = "https://emailverifier.reoon.com/api/v1";
const DEFAULT_TIMEOUT_MS = 15000;

export class ReoonProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ReoonProviderError";
  }
}

/**
 * Server-only Reoon Email Verifier provider client.
 * In Phase 1, paid live verifications are deactivated by design.
 */
export class ReoonClient {
  private readonly apiKey: string | null;
  private readonly mode: ReoonVerificationMode;

  constructor() {
    this.apiKey = process.env.REOON_API_KEY?.trim() || null;
    const envMode = (process.env.EMAIL_VERIFICATION_MODE || "mock").toLowerCase();
    this.mode = envMode === "live" ? "live" : "mock";
  }

  /**
   * Safe status inspection that does not expose the raw API key.
   */
  public getConfigStatus(): ReoonConfigStatus {
    const hasApiKey = Boolean(this.apiKey && this.apiKey.length > 5);
    return {
      isConfigured: hasApiKey,
      mode: this.mode,
      provider: "REOON",
      hasApiKey,
      readyForPhase2: hasApiKey,
    };
  }

  /**
   * Normalizes Reoon provider status into application status.
   */
  public normalizeStatus(rawStatus: ReoonRawStatus | string): NormalizedVerificationStatus {
    const s = (rawStatus || "").toLowerCase();
    switch (s) {
      case "safe":
      case "valid":
        return "VALID";
      case "invalid":
      case "spamtrap":
      case "disabled":
        return "INVALID";
      case "disposable":
      case "catch_all":
      case "catch-all":
      case "role_account":
      case "role":
        return "RISKY";
      default:
        return "UNKNOWN";
    }
  }

  /**
   * Deterministic mock verification for safe development & testing.
   * Clearly marked with isMock: true, never claims to be live verification.
   */
  public getMockResult(email: string): NormalizedVerifyResult {
    const normalized = normalizeEmail(email);
    let status: NormalizedVerificationStatus = "VALID";
    let providerStatus: ReoonRawStatus = "safe";
    let providerSubstatus: string | null = null;
    let isDisposable = false;
    let isRoleBased = false;
    let isCatchAll = false;
    let reason: string | null = null;

    if (normalized.includes("invalid") || normalized.includes("bounce")) {
      status = "INVALID";
      providerStatus = "invalid";
      providerSubstatus = "mailbox_not_found";
      reason = "Mailbox does not exist on target mail server";
    } else if (normalized.includes("disposable") || normalized.includes("tempmail") || normalized.includes("mailinator")) {
      status = "RISKY";
      providerStatus = "disposable";
      isDisposable = true;
      providerSubstatus = "disposable_domain";
      reason = "Domain is associated with temporary disposable email addresses";
    } else if (normalized.includes("admin") || normalized.includes("support") || normalized.includes("info")) {
      status = "RISKY";
      providerStatus = "role_account";
      isRoleBased = true;
      reason = "Role-based group inbox address";
    } else if (normalized.includes("catchall")) {
      status = "RISKY";
      providerStatus = "catch_all";
      isCatchAll = true;
      reason = "Server accepts all incoming messages (catch-all)";
    } else if (normalized.includes("unknown")) {
      status = "UNKNOWN";
      providerStatus = "unknown";
      reason = "Connection timed out during SMTP handshake";
    }

    return {
      email,
      normalizedEmail: normalized,
      status,
      providerStatus,
      providerSubstatus,
      reason,
      isDisposable,
      isRoleBased,
      isCatchAll,
      isMock: true,
      rawResponse: {
        mock: true,
        email,
        status: providerStatus,
        sub_status: providerSubstatus,
      },
      verifiedAt: new Date(),
    };
  }

  /**
   * Phase 1 guard: Live verification execution is intentionally blocked until Phase 2.
   */
  public async verifySingle(
    email: string,
    _apiMode: ReoonApiMode = "quick"
  ): Promise<NormalizedVerifyResult> {
    void _apiMode;
    if (this.mode === "mock") {
      return this.getMockResult(email);
    }

    // Guard against premature paid API execution in Phase 1
    throw new ReoonProviderError(
      "Live verification is intentionally disabled in Phase 1. Real Reoon verification actions are activated in Phase 2."
    );
  }

  /**
   * Safe credit balance query. In Phase 1 or mock mode, reports safe placeholder.
   */
  public async getAccountBalance(): Promise<{
    credits: number | null;
    status: string;
    isMock: boolean;
  }> {
    if (this.mode === "mock" || !this.apiKey) {
      return {
        credits: null,
        status: "Mock Mode (Credits Disabled)",
        isMock: true,
      };
    }

    // In live mode, we query account balance if API key is present
    try {
      const url = `${REOON_BASE_URL}/account-balance/?key=${encodeURIComponent(this.apiKey)}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });

      if (!res.ok) {
        throw new ReoonProviderError(`Reoon API responded with status ${res.status}`);
      }

      const data = (await res.json()) as ReoonAccountBalanceResponse;
      return {
        credits: typeof data.credits === "number" ? data.credits : null,
        status: data.status || "OK",
        isMock: false,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        credits: null,
        status: `Connection check: ${message}`,
        isMock: false,
      };
    }
  }
}

export const reoonClient = new ReoonClient();
