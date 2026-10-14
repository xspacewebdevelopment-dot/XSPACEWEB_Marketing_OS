export type ContactVerificationStatus =
  | "UNVERIFIED"
  | "VALID"
  | "INVALID"
  | "RISKY"
  | "UNKNOWN";

export type ContactSubscriptionStatus =
  | "PENDING"
  | "SUBSCRIBED"
  | "UNSUBSCRIBED"
  | "BOUNCED";

export interface ContactItem {
  id: string;
  workspaceId: string;
  email: string;
  normalizedEmail: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  tags: string[];
  customFields: Record<string, any> | null;
  notes: string | null;
  isArchived: boolean;
  verificationStatus: ContactVerificationStatus;
  lastVerifiedAt: string | null;
  subscriptionStatus: ContactSubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  // Dynamic Bidirectional Suppression State
  isSuppressed?: boolean;
  suppressionReason?: string | null;
  suppressionSource?: string | null;
  // Associated Lists
  lists?: Array<{
    id: string;
    name: string;
  }>;
}

export interface ContactQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  verificationStatus?: ContactVerificationStatus | "ALL";
  suppressionStatus?: "SUPPRESSED" | "UNSUPPRESSED" | "ALL";
  subscriptionStatus?: ContactSubscriptionStatus | "ALL";
  listId?: string;
  tag?: string;
  isArchived?: boolean;
  sortBy?: "createdAt" | "name" | "email" | "company" | "verificationStatus";
  sortOrder?: "asc" | "desc";
}

export interface ContactStats {
  totalContacts: number;
  validCount: number;
  invalidCount: number;
  riskyCount: number;
  unverifiedCount: number;
  suppressedCount: number;
  subscribedCount: number;
}

export interface ContactListSummary {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SegmentFilterField =
  | "email"
  | "name"
  | "company"
  | "phone"
  | "verificationStatus"
  | "suppressionStatus"
  | "subscriptionStatus"
  | "tag"
  | "listId";

export type SegmentOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "is_true"
  | "is_false"
  | "in";

export interface SegmentCondition {
  field: SegmentFilterField;
  operator: SegmentOperator;
  value?: any;
}

export interface SegmentConditionGroup {
  matchType: "AND" | "OR";
  conditions: SegmentCondition[];
}

export interface SegmentSummary {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  conditions: SegmentConditionGroup;
  matchingCount?: number;
  createdAt: string;
  updatedAt: string;
}
