/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

export type SmsReportDateRange = "7d" | "30d" | "90d" | "all";

export interface SmsReportsData {
  workspaceId: string;
  range: SmsReportDateRange;
  dateBoundary: {
    startDate: string | null;
    endDate: string;
    timezone: "UTC";
    description: string;
  };
  summary: {
    totalCampaigns: number;
    draftsCount: number;
    scheduledCount: number;
    sentCount: number; // Dispatched or marked sent in system; NOT carrier delivery proof
    archivedCount: number;
    otherStatusCount: number;
    smsCount: number;
    rcsCount: number;
    totalEstimatedRecipients: number;
    totalEstimatedSegments: number;
    avgEstimatedRecipientsPerCampaign: number;
  };
  channels: {
    sms: {
      count: number;
      percentage: number;
    };
    rcs: {
      count: number;
      percentage: number;
    };
  };
  encoding: {
    gsm7: number;
    ucs2: number;
    other: number;
  };
  templates: {
    total: number;
    smsCount: number;
    rcsCount: number;
    categoryBreakdown: Record<string, number>;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    protocol: string;
    status: string;
    senderId: string;
    encoding: string;
    characterCount: number;
    segments: number;
    totalRecipients: number;
    totalSegments: number;
    scheduledAt: Date | null;
    sentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  carrierDeliveryLogs: {
    isAvailable: boolean;
    reason: string;
    records: never[];
  };
}

export class SmsReportService {
  /**
   * Get comprehensive SMS & RCS reporting metrics scoped strictly to workspaceId.
   *
   * Date Boundary & Timezone Behavior:
   * - All date filtering is applied consistently to the `createdAt` column of `sms_broadcasts`.
   * - Date calculations use UTC rolling boundaries relative to the server execution timestamp:
   *   - "7d": Now minus 7 days (rolling 168 hours in UTC)
   *   - "30d": Now minus 30 days (rolling 720 hours in UTC)
   *   - "90d": Now minus 90 days (rolling 2160 hours in UTC)
   *   - "all": No lower date boundary applied (all historical records for this workspace)
   * - Template statistics reflect current workspace template inventory.
   * - Recipient and segment totals represent saved pre-send audience estimates, NOT verified
   *   carrier delivery receipts, unique handsets, or billed telecom units.
   * - Broadcasts with status 'SENT' represent campaigns marked as dispatched in the application,
   *   not carrier-confirmed handset delivery receipts.
   */
  public async getWorkspaceReports(
    workspaceId: string,
    range: SmsReportDateRange = "30d"
  ): Promise<SmsReportsData> {
    if (!workspaceId || typeof workspaceId !== "string" || !workspaceId.trim()) {
      throw new Error("Workspace ID is required");
    }

    const validRanges: SmsReportDateRange[] = ["7d", "30d", "90d", "all"];
    const effectiveRange: SmsReportDateRange = validRanges.includes(range) ? range : "30d";

    const now = new Date();
    let startDate: Date | null = null;

    if (effectiveRange === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (effectiveRange === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (effectiveRange === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const broadcastWhere: any = { workspaceId: workspaceId.trim() };
    if (startDate) {
      broadcastWhere.createdAt = { gte: startDate };
    }

    // Query both broadcast aggregates and workspace template inventory strictly scoped to workspaceId
    const [broadcasts, recentCampaigns, templates] = await Promise.all([
      (prisma as any).smsBroadcast.findMany({
        where: broadcastWhere,
        select: {
          id: true,
          protocol: true,
          status: true,
          encoding: true,
          totalRecipients: true,
          totalSegments: true,
          createdAt: true,
        },
      }),
      (prisma as any).smsBroadcast.findMany({
        where: broadcastWhere,
        take: 15,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          protocol: true,
          status: true,
          senderId: true,
          encoding: true,
          characterCount: true,
          segments: true,
          totalRecipients: true,
          totalSegments: true,
          scheduledAt: true,
          sentAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      (prisma as any).smsTemplate.findMany({
        where: { workspaceId: workspaceId.trim() },
        select: {
          id: true,
          protocol: true,
          category: true,
        },
      }),
    ]);

    // Calculate broadcast metrics
    const totalCampaigns = broadcasts.length;
    let draftsCount = 0;
    let scheduledCount = 0;
    let sentCount = 0;
    let archivedCount = 0;
    let otherStatusCount = 0;

    let smsCount = 0;
    let rcsCount = 0;

    let gsm7Count = 0;
    let ucs2Count = 0;
    let otherEncodingCount = 0;

    let totalEstimatedRecipients = 0;
    let totalEstimatedSegments = 0;

    for (const b of broadcasts) {
      // Status breakdown
      const status = (b.status || "").trim().toUpperCase();
      if (status === "DRAFT") {
        draftsCount++;
      } else if (status === "SCHEDULED") {
        scheduledCount++;
      } else if (status === "SENT") {
        sentCount++;
      } else if (status === "ARCHIVED") {
        archivedCount++;
      } else {
        otherStatusCount++;
      }

      // Protocol/Channel breakdown
      const proto = (b.protocol || "").trim().toUpperCase();
      if (proto === "RCS") {
        rcsCount++;
      } else {
        smsCount++;
      }

      // Safe encoding breakdown handling missing or unexpected values
      const enc = (b.encoding || "").trim().toUpperCase();
      if (enc === "GSM-7") {
        gsm7Count++;
      } else if (enc === "UCS-2") {
        ucs2Count++;
      } else {
        otherEncodingCount++;
      }

      // Safe numeric aggregation for estimates
      const rec = typeof b.totalRecipients === "number" && !isNaN(b.totalRecipients)
        ? Math.max(0, b.totalRecipients)
        : 0;
      const seg = typeof b.totalSegments === "number" && !isNaN(b.totalSegments)
        ? Math.max(0, b.totalSegments)
        : 0;

      totalEstimatedRecipients += rec;
      totalEstimatedSegments += seg;
    }

    const avgEstimatedRecipientsPerCampaign =
      totalCampaigns > 0
        ? Math.round(totalEstimatedRecipients / totalCampaigns)
        : 0;

    const smsPercentage =
      totalCampaigns > 0 ? Math.round((smsCount / totalCampaigns) * 100) : 0;
    const rcsPercentage =
      totalCampaigns > 0 ? Math.round((rcsCount / totalCampaigns) * 100) : 0;

    // Template breakdowns
    const totalTemplates = templates.length;
    let smsTemplatesCount = 0;
    let rcsTemplatesCount = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const t of templates) {
      const proto = (t.protocol || "").trim().toUpperCase();
      if (proto === "RCS") {
        rcsTemplatesCount++;
      } else {
        smsTemplatesCount++;
      }

      const cat = (t.category || "GENERAL").trim().toUpperCase();
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    }

    let dateDesc = "All historical broadcasts";
    if (effectiveRange === "7d") dateDesc = "Past 7 days (rolling UTC)";
    else if (effectiveRange === "30d") dateDesc = "Past 30 days (rolling UTC)";
    else if (effectiveRange === "90d") dateDesc = "Past 90 days (rolling UTC)";

    return {
      workspaceId: workspaceId.trim(),
      range: effectiveRange,
      dateBoundary: {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: now.toISOString(),
        timezone: "UTC",
        description: dateDesc,
      },
      summary: {
        totalCampaigns,
        draftsCount,
        scheduledCount,
        sentCount,
        archivedCount,
        otherStatusCount,
        smsCount,
        rcsCount,
        totalEstimatedRecipients,
        totalEstimatedSegments,
        avgEstimatedRecipientsPerCampaign,
      },
      channels: {
        sms: {
          count: smsCount,
          percentage: smsPercentage,
        },
        rcs: {
          count: rcsCount,
          percentage: rcsPercentage,
        },
      },
      encoding: {
        gsm7: gsm7Count,
        ucs2: ucs2Count,
        other: otherEncodingCount,
      },
      templates: {
        total: totalTemplates,
        smsCount: smsTemplatesCount,
        rcsCount: rcsTemplatesCount,
        categoryBreakdown,
      },
      recentCampaigns: recentCampaigns.map((c: any) => ({
        id: c.id,
        name: c.name,
        protocol: c.protocol,
        status: c.status,
        senderId: c.senderId,
        encoding: c.encoding || "UNKNOWN",
        characterCount: c.characterCount ?? 0,
        segments: c.segments ?? 1,
        totalRecipients: c.totalRecipients ?? 0,
        totalSegments: c.totalSegments ?? 0,
        scheduledAt: c.scheduledAt,
        sentAt: c.sentAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      carrierDeliveryLogs: {
        isAvailable: false,
        reason:
          "Carrier delivery status receipts (DLR), latency analytics, and two-way STOP opt-out suppression logs require active mobile provider integration (e.g. Twilio, Sinch, or Infobip). Currently displaying real stored workspace campaign and template metrics.",
        records: [],
      },
    };
  }
}

export const smsReportService = new SmsReportService();
