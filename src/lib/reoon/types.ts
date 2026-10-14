export type VerificationDepth = "POWER" | "QUICK";

export type ReoonRawStatus =
  | "safe"
  | "valid"
  | "invalid"
  | "disabled"
  | "disposable"
  | "inbox_full"
  | "catch_all"
  | "catch-all"
  | "role_account"
  | "role"
  | "spamtrap"
  | "unknown";

export type NormalizedVerificationStatus =
  | "VALID"
  | "INVALID"
  | "RISKY"
  | "UNKNOWN";

export interface ReoonRawVerifyResponse {
  email?: string;
  status?: string;
  sub_status?: string;
  substatus?: string;
  overall_score?: number | null;
  score?: number | null;
  is_valid_syntax?: boolean;
  is_disposable?: boolean;
  is_role_account?: boolean;
  is_catch_all?: boolean;
  is_deliverable?: boolean;
  can_connect_smtp?: boolean;
  has_inbox_full?: boolean;
  is_disabled?: boolean;
  is_spamtrap?: boolean;
  is_free_email?: boolean;
  mx_accepts_mail?: boolean;
  domain?: string;
  mx_records?: string[];
  username?: string;
  reason?: string;
  message?: string;
  api_status?: string;
  [key: string]: unknown;
}

export interface ReoonBalanceApiResponse {
  api_status?: string;
  status?: string;
  remaining_daily_credits?: number;
  remaining_instant_credits?: number;
  message?: string;
  credits?: number;
}

export interface NormalizedVerificationDetails {
  id?: string;
  email: string;
  normalizedEmail: string;
  status: NormalizedVerificationStatus;
  verificationMode: VerificationDepth;
  provider: "REOON";
  providerStatus: string;
  providerSubstatus: string | null;
  reason: string | null;
  overallScore: number | null;
  isValidSyntax: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
  isCatchAll: boolean;
  mxAcceptsMail: boolean | null;
  canConnectSmtp: boolean | null;
  isDeliverable: boolean | null;
  isSpamtrap: boolean;
  isDisabled: boolean;
  hasInboxFull: boolean;
  isFreeEmail: boolean;
  domain: string | null;
  mxRecords: string[];
  rawResponse: Record<string, unknown>;
  verifiedAt: string;
  hasConflictingSignals?: boolean;
  contactUpdated?: boolean;
  notice?: string;
}

export interface ProviderCreditBalance {
  dailyCreditsRemaining: number | null;
  instantCreditsRemaining: number | null;
  totalCreditsRemaining: number | null;
  status: "active" | "insufficient" | "unavailable";
  message?: string;
  lastRefreshedAt: string;
  hasApiKey: boolean;
}

export interface ReoonConfigStatus {
  isConfigured: boolean;
  provider: "REOON";
  hasApiKey: boolean;
  readyForPhase2: boolean;
  readyForPhase3: boolean;
}

export type ReoonBulkApiStatus =
  | "waiting"
  | "running"
  | "completed"
  | "file_not_found"
  | "file_loading_error"
  | "error";

export interface ReoonCreateBulkResponse {
  status: "success" | "error" | string;
  task_id?: number | string;
  count_submitted?: number;
  count_duplicates_removed?: number;
  count_rejected_emails?: number;
  count_processing?: number;
  reason?: string;
  message?: string;
}

export interface ReoonBulkTaskResultResponse {
  task_id?: number | string;
  name?: string;
  status: string;
  count_total?: number;
  count_checked?: number;
  progress_percentage?: number;
  results?: Record<string, ReoonRawVerifyResponse> | ReoonRawVerifyResponse[];
  reason?: string;
  message?: string;
}

export interface NormalizedBulkTaskProgress {
  taskId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  rawProviderStatus: string;
  countTotal: number;
  countProcessed: number;
  progressPercentage: number;
  isFinished: boolean;
  results?: NormalizedVerificationDetails[];
  error?: string;
}

