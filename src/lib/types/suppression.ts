export type SuppressionReason =
  | "MANUAL_BLOCK"
  | "DO_NOT_CONTACT"
  | "UNSUBSCRIBED"
  | "HARD_BOUNCE"
  | "SPAM_COMPLAINT"
  | "SYSTEM_EXCLUSION";

export type SuppressionSource =
  | "MANUAL"
  | "IMPORT"
  | "BOUNCE"
  | "COMPLAINT"
  | "UNSUBSCRIBE"
  | "SYSTEM";

export type SuppressionStatus = "ACTIVE" | "REMOVED";

export interface SuppressionQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  reason?: SuppressionReason | "ALL";
  source?: SuppressionSource | "ALL";
  status?: SuppressionStatus | "ALL";
  sortBy?: "createdAt" | "normalizedEmail" | "reason" | "source";
  sortOrder?: "asc" | "desc";
}

export interface SuppressionStats {
  totalSuppressed: number;
  manualCount: number;
  autoCount: number;
  unsubscribedCount: number;
  hardBouncedCount: number;
  complaintCount: number;
}

export interface RecipientEligibilityResult {
  totalSubmitted: number;
  eligibleCount: number;
  excludedCount: number;
  eligibleEmails: string[];
  excludedRecords: Array<{
    email: string;
    normalizedEmail: string;
    reason: string;
    source: string;
    suppressedAt: string;
  }>;
}

export const REASON_LABELS: Record<string, string> = {
  MANUAL_BLOCK: "Manual Block",
  DO_NOT_CONTACT: "Do Not Contact",
  UNSUBSCRIBED: "Unsubscribed",
  HARD_BOUNCE: "Hard Bounce",
  SPAM_COMPLAINT: "Spam Complaint",
  SYSTEM_EXCLUSION: "System Exclusion",
};

export const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  IMPORT: "Bulk Import",
  BOUNCE: "Automated Bounce",
  COMPLAINT: "Spam Complaint",
  UNSUBSCRIBE: "Opt-Out / Unsubscribe",
  SYSTEM: "System Policy",
};
