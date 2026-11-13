import { parseAndNormalizePhoneNumber } from "@/lib/sms/phone";
import type {
  SmsProviderInterface,
  WalletBalanceResult,
  SendSmsOptions,
  SendSmsResult,
  SendRcsOptions,
  SendRcsResult,
} from "./provider-interface";

const FAST2SMS_API_BASE = "https://www.fast2sms.com/dev";
const DEFAULT_TIMEOUT_MS = 10000;

export class Fast2SmsProvider implements SmsProviderInterface {
  public readonly providerName = "FAST2SMS";

  /**
   * Securely retrieve the Fast2SMS API key from server environment.
   * Never exposed to the client or serialized in API responses.
   */
  private getApiKey(): string | null {
    const key = process.env.FAST2SMS_API_KEY;
    if (!key || typeof key !== "string" || !key.trim()) {
      return null;
    }
    return key.trim();
  }

  /**
   * Checks if server credentials are configured.
   */
  public isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  /**
   * Safely formats and validates an Indian mobile number.
   * Fast2SMS strictly requires 10-digit Indian numbers starting with 6, 7, 8, or 9.
   */
  public normalizeIndianPhone(rawPhone: string): {
    isValid: boolean;
    tenDigitNumber: string;
    e164: string;
    error?: string;
  } {
    const parsed = parseAndNormalizePhoneNumber(rawPhone, "IN");
    if (!parsed.isValid || !parsed.e164) {
      return {
        isValid: false,
        tenDigitNumber: "",
        e164: "",
        error: parsed.error || "Invalid phone number format",
      };
    }

    // Fast2SMS only supports Indian mobile numbers
    if (parsed.country !== "IN") {
      return {
        isValid: false,
        tenDigitNumber: "",
        e164: parsed.e164,
        error: `Fast2SMS only supports Indian mobile numbers (+91). Recipient country detected: ${
          parsed.country || "Unknown"
        }`,
      };
    }

    // Extract national 10-digit number from E.164 (+91XXXXXXXXXX)
    const digitsOnly = parsed.e164.replace(/\D/g, "");
    const tenDigits = digitsOnly.startsWith("91") && digitsOnly.length === 12
      ? digitsOnly.slice(2)
      : digitsOnly;

    if (!/^[6-9]\d{9}$/.test(tenDigits)) {
      return {
        isValid: false,
        tenDigitNumber: "",
        e164: parsed.e164,
        error: `Invalid Indian mobile number: ${tenDigits}. Must be a valid 10-digit number starting with 6, 7, 8, or 9.`,
      };
    }

    return {
      isValid: true,
      tenDigitNumber: tenDigits,
      e164: parsed.e164,
    };
  }

  /**
   * Non-destructive connection & credit balance check.
   * Queries the Fast2SMS wallet endpoint without sending any SMS or incurring costs.
   */
  public async testConnection(): Promise<WalletBalanceResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        isConfigured: false,
        error: "FAST2SMS_API_KEY environment variable is not configured on the server.",
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      const response = await fetch(`${FAST2SMS_API_BASE}/wallet`, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        const errorMsg =
          (data && (data.message || data.error)) ||
          `Fast2SMS HTTP ${response.status}: ${response.statusText}`;
        return {
          success: false,
          isConfigured: true,
          statusCode: response.status,
          error: typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
        };
      }

      if (data.return === true || typeof data.wallet === "number") {
        return {
          success: true,
          isConfigured: true,
          walletBalance: Number(data.wallet) || 0,
          currency: "INR",
        };
      }

      return {
        success: false,
        isConfigured: true,
        statusCode: data.status_code || 400,
        error: Array.isArray(data.message) ? data.message.join(", ") : data.message || "Failed to retrieve wallet balance",
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          success: false,
          isConfigured: true,
          error: "Connection test timed out after 10 seconds. Please verify network access to fast2sms.com.",
        };
      }
      return {
        success: false,
        isConfigured: true,
        error: err.message || "Network error while connecting to Fast2SMS",
      };
    }
  }

  /**
   * Sends an SMS message via Fast2SMS.
   * If isLive is false, runs in safe local simulation mode (zero external HTTP calls).
   * In live mode, performs single-dispatch without automated retries to prevent duplicate billing.
   */
  public async sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
    const {
      recipientPhone,
      messageText,
      route = "q",
      senderId,
      dltTemplateId,
      variablesValues,
      isLive = false,
    } = options;

    // Validate phone number
    const phoneCheck = this.normalizeIndianPhone(recipientPhone);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        status: "REJECTED",
        provider: "FAST2SMS",
        isSimulated: !isLive,
        error: phoneCheck.error || "Invalid phone number",
        deliveryState: "UNDELIVERED",
      };
    }

    // Validate message content
    if (!messageText || !messageText.trim()) {
      return {
        success: false,
        status: "REJECTED",
        provider: "FAST2SMS",
        isSimulated: !isLive,
        error: "Message text cannot be empty.",
        deliveryState: "UNDELIVERED",
      };
    }

    // SAFE SIMULATION MODE: Zero external network requests
    if (!isLive) {
      const simulatedId = `sim_f2s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return {
        success: true,
        status: "SIMULATED",
        provider: "SIMULATION",
        requestId: simulatedId,
        recipientPhoneNorm: phoneCheck.e164,
        isSimulated: true,
        deliveryState: "SIMULATED_LOCAL",
      };
    }

    // LIVE SEND MODE: Validate credentials
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        status: "FAILED",
        provider: "FAST2SMS",
        isSimulated: false,
        error: "FAST2SMS_API_KEY environment variable is missing on server.",
        deliveryState: "UNDELIVERED",
      };
    }

    // Build payload according to selected route
    let payload: Record<string, any>;

    if (route === "dlt") {
      if (!senderId || !senderId.trim()) {
        return {
          success: false,
          status: "REJECTED",
          provider: "FAST2SMS",
          isSimulated: false,
          error: "DLT route requires an approved 3-6 character sender ID (Header).",
          deliveryState: "UNDELIVERED",
        };
      }
      if (!dltTemplateId || !dltTemplateId.trim()) {
        return {
          success: false,
          status: "REJECTED",
          provider: "FAST2SMS",
          isSimulated: false,
          error: "DLT route requires an approved DLT Template ID (message ID).",
          deliveryState: "UNDELIVERED",
        };
      }

      payload = {
        route: "dlt",
        sender_id: senderId.trim(),
        message: dltTemplateId.trim(),
        variables_values: variablesValues || "",
        numbers: phoneCheck.tenDigitNumber,
      };
    } else {
      // Quick SMS route (route: "q")
      payload = {
        route: "q",
        message: messageText.trim(),
        language: "english",
        flash: 0,
        numbers: phoneCheck.tenDigitNumber,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      const response = await fetch(`${FAST2SMS_API_BASE}/bulkV2`, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (data && data.return === true) {
        return {
          success: true,
          status: "SUBMITTED_TO_CARRIER",
          provider: "FAST2SMS",
          requestId: data.request_id || undefined,
          recipientPhoneNorm: phoneCheck.e164,
          isSimulated: false,
          deliveryState: "PENDING_DELIVERY_CONFIRMATION",
        };
      }

      // Extract error details from Fast2SMS response body or HTTP status
      const statusCode = data?.status_code || response.status;
      let rawMsg =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.message) ? data.message.join(", ") : null);

      let errorMsg =
        typeof rawMsg === "string"
          ? rawMsg
          : `Fast2SMS HTTP error ${response.status}: ${response.statusText}`;

      if (statusCode === 428 || errorMsg.toLowerCase().includes("quick api access is disabled")) {
        errorMsg =
          "Quick API Access is disabled on your Fast2SMS account. Log into your Fast2SMS panel -> Dev API -> enable Quick API access, or switch to DLT Route with an approved template.";
      } else if (statusCode === 412 || statusCode === 401 && errorMsg.toLowerCase().includes("authorization")) {
        errorMsg =
          "Authentication failed. The FAST2SMS_API_KEY was rejected by Fast2SMS. Please check your API key in .env.local.";
      } else if (statusCode === 416 || errorMsg.toLowerCase().includes("insufficient")) {
        errorMsg = "Insufficient Fast2SMS wallet balance to dispatch this message.";
      } else if (statusCode === 996) {
        errorMsg =
          "Before using this route, complete website verification on Fast2SMS or use DLT SMS API.";
      } else if (statusCode === 999) {
        errorMsg =
          "Fast2SMS account requires completing minimum transaction verification before API dispatch.";
      }

      return {
        success: false,
        status: "FAILED",
        provider: "FAST2SMS",
        statusCode,
        recipientPhoneNorm: phoneCheck.e164,
        isSimulated: false,
        error: errorMsg,
        deliveryState: "UNDELIVERED",
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          success: false,
          status: "FAILED",
          provider: "FAST2SMS",
          recipientPhoneNorm: phoneCheck.e164,
          isSimulated: false,
          error: "SMS dispatch request timed out after 10 seconds. Fast2SMS did not respond in time.",
          deliveryState: "UNDELIVERED",
        };
      }
      return {
        success: false,
        status: "FAILED",
        provider: "FAST2SMS",
        recipientPhoneNorm: phoneCheck.e164,
        isSimulated: false,
        error: err.message || "Network error during SMS dispatch",
        deliveryState: "UNDELIVERED",
      };
    }
  }

  /**
   * Outbound RCS dispatch is explicitly disabled.
   * Fast2SMS does not expose an automated outbound REST API for RCS.
   */
  public async sendRcs(_options: SendRcsOptions): Promise<SendRcsResult> {
    return {
      success: false,
      status: "NOT_CONNECTED",
      provider: "FAST2SMS",
      error:
        "Fast2SMS does not expose an automated outbound REST API for RCS. RCS campaigns remain draft-only and cannot be dispatched via API.",
    };
  }
}

export const fast2SmsProvider = new Fast2SmsProvider();
