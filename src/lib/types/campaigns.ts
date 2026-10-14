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
    color: "text-slate-300",
    bg: "bg-slate-800/80",
    border: "border-slate-700",
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "text-amber-300",
    bg: "bg-amber-950/40",
    border: "border-amber-800/50",
  },
  QUEUED: {
    label: "Queued",
    color: "text-blue-300",
    bg: "bg-blue-950/40",
    border: "border-blue-800/50",
  },
  SENDING: {
    label: "Sending",
    color: "text-indigo-300",
    bg: "bg-indigo-950/40",
    border: "border-indigo-800/50",
  },
  COMPLETED: {
    label: "Sent",
    color: "text-emerald-300",
    bg: "bg-emerald-950/40",
    border: "border-emerald-800/50",
  },
  PAUSED: {
    label: "Paused",
    color: "text-orange-300",
    bg: "bg-orange-950/40",
    border: "border-orange-800/50",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-slate-400",
    bg: "bg-slate-900/60",
    border: "border-slate-800",
  },
  FAILED: {
    label: "Failed",
    color: "text-rose-300",
    bg: "bg-rose-950/40",
    border: "border-rose-800/50",
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-slate-500",
    bg: "bg-slate-900/30",
    border: "border-slate-800/50",
  },
};

// Zod schemas for request validation
export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
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
  fromName: z.string().min(1, "From Name is required").max(100),
  fromEmail: z.string().email("Valid From Email is required"),
  replyTo: z.string().email("Valid Reply-To is required").optional().nullable().or(z.literal("")),
  subject: z.string().min(1, "Subject line is required").max(300),
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
