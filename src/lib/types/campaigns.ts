import { z } from "zod";

export type CampaignType =
  | "NEWSLETTER"
  | "PROMOTIONAL"
  | "PRODUCT_UPDATE"
  | "EVENT_INVITATION"
  | "RE_ENGAGEMENT";

export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "QUEUED"
  | "SENDING"
  | "COMPLETED"
  | "PAUSED"
  | "CANCELLED"
  | "FAILED"
  | "ARCHIVED";

export type RecipientStatus =
  | "PENDING"
  | "SUBMITTED"
  | "DELIVERED"
  | "FAILED"
  | "EXCLUDED"
  | "BOUNCED"
  | "COMPLAINED"
  | "UNSUBSCRIBED";

export interface AudienceConfig {
  contactIds?: string[];
  listIds?: string[];
  segmentIds?: string[];
  excludedListIds?: string[];
  excludedContactIds?: string[];
}

export interface AudienceBreakdown {
  totalRaw: number;
  selected: number;
  duplicates: number;
  suppressed: number;
  unsubscribed: number;
  invalidOrRisky: number;
  eligible: number;
  sampleEligible: Array<{
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    company?: string | null;
    verificationStatus: string;
    subscriptionStatus: string;
  }>;
}

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

export interface TrackingSettings {
  trackOpens: boolean;
  trackClicks: boolean;
}

export interface CampaignSummary {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  type: CampaignType;
  status: CampaignStatus;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  subject: string;
  preheader?: string | null;
  templateId?: string | null;
  totalRecipients: number;
  submittedCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  complainedCount: number;
  unsubscribedCount: number;
  failedCount: number;
  scheduledAt?: string | null;
  timezone?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  NEWSLETTER: "Newsletter",
  PROMOTIONAL: "Promotional",
  PRODUCT_UPDATE: "Product Update",
  EVENT_INVITATION: "Event Invitation",
  RE_ENGAGEMENT: "Re-engagement",
};

export const CAMPAIGN_STATUS_BADGES: Record<
  CampaignStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  QUEUED: {
    label: "Queued",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  SENDING: {
    label: "Sending",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  COMPLETED: {
    label: "Sent",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  PAUSED: {
    label: "Paused",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
  FAILED: {
    label: "Failed",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
};

// Zod schemas for request validation
export const createCampaignSchema = z.object({
  name: z.string().max(200).optional().default("New Campaign"),
  description: z.string().max(1000).optional().nullable(),
  type: z
    .enum([
      "NEWSLETTER",
      "PROMOTIONAL",
      "PRODUCT_UPDATE",
      "EVENT_INVITATION",
      "RE_ENGAGEMENT",
    ])
    .default("NEWSLETTER"),
  fromName: z.string().max(100).optional().default("Marketing"),
  fromEmail: z.string().optional().default("marketing@xspacecode.com"),
  replyTo: z.string().optional().nullable().or(z.literal("")),
  subject: z.string().max(300).optional().default(""),
  preheader: z.string().max(300).optional().nullable(),
  templateId: z.string().optional().nullable(),
  compiledHtml: z.string().optional().nullable(),
  editorJson: z.any().optional().nullable(),
  plainText: z.string().optional().nullable(),
  audienceConfig: z
    .object({
      contactIds: z.array(z.string()).optional(),
      listIds: z.array(z.string()).optional(),
      segmentIds: z.array(z.string()).optional(),
      excludedListIds: z.array(z.string()).optional(),
      excludedContactIds: z.array(z.string()).optional(),
    })
    .optional(),
  utmParams: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
  trackingSettings: z
    .object({
      trackOpens: z.boolean().default(false),
      trackClicks: z.boolean().default(false),
    })
    .optional(),
  postalAddress: z.string().max(300).optional().nullable(),
  batchSize: z.number().int().min(10).max(500).default(100),
  batchDelayMs: z.number().int().min(500).max(10000).default(1000),
});

export const updateCampaignSchema = createCampaignSchema.partial();
