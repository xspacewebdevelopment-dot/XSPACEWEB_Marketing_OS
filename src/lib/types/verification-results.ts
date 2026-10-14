export interface ResultsQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: "verifiedAt" | "email" | "status" | "overallScore";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: string; // VALID, INVALID, RISKY, UNKNOWN
  source?: string; // SINGLE, BULK
  jobId?: string;
  domain?: string;
  providerStatus?: string;
  isCatchAll?: boolean;
  isDisposable?: boolean;
  isRoleBased?: boolean;
  isDeliverable?: boolean;
  isSpamtrap?: boolean;
  dateFrom?: string;
  dateTo?: string;
  uniqueEmailsOnly?: boolean;
}

export interface CleaningRules {
  excludeInvalid?: boolean;
  excludeRisky?: boolean;
  excludeDisposable?: boolean;
  excludeCatchAll?: boolean;
  excludeRoleBased?: boolean;
  excludeUnknown?: boolean;
  removeDuplicates?: boolean;
  excludeSuppressed?: boolean;
  onlyPowerMode?: boolean;
}

export const DEFAULT_CLEANING_RULES: CleaningRules = {
  excludeInvalid: true,
  excludeRisky: true,
  excludeDisposable: true,
  excludeCatchAll: true,
  excludeRoleBased: true,
  excludeUnknown: true,
  removeDuplicates: true,
  excludeSuppressed: true,
  onlyPowerMode: false,
};
