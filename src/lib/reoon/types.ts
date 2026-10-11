export type ReoonVerificationMode = "mock" | "live";

export type ReoonApiMode = "quick" | "power";

export type ReoonRawStatus =
  | "safe"
  | "invalid"
  | "disposable"
  | "catch_all"
  | "role_account"
  | "spamtrap"
  | "unknown";

export type NormalizedVerificationStatus =
  | "VALID"
  | "INVALID"
  | "RISKY"
  | "UNKNOWN";

export interface ReoonSingleVerifyResponse {
  email: string;
  status: ReoonRawStatus;
  sub_status?: string;
  is_disposable?: boolean;
  is_role_account?: boolean;
  is_catch_all?: boolean;
  is_deliverable?: boolean;
  mx_records?: string[];
  smtp_provider?: string;
  score?: number;
  reason?: string;
}

export interface ReoonAccountBalanceResponse {
  status: string;
  credits: number;
  daily_credits?: number;
  message?: string;
}

export interface NormalizedVerifyResult {
  email: string;
  normalizedEmail: string;
  status: NormalizedVerificationStatus;
  providerStatus: string;
  providerSubstatus: string | null;
  reason: string | null;
  isDisposable: boolean;
  isRoleBased: boolean;
  isCatchAll: boolean;
  isMock: boolean;
  rawResponse: Record<string, unknown>;
  verifiedAt: Date;
}

export interface ReoonConfigStatus {
  isConfigured: boolean;
  mode: ReoonVerificationMode;
  provider: "REOON";
  hasApiKey: boolean;
  readyForPhase2: boolean;
}
