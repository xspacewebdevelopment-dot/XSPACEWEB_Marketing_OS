/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

export type VoiceReportDateRange = "7d" | "30d" | "90d" | "all";

export interface VoiceReportsData {
  range: VoiceReportDateRange;
  isSimulated: true;
  providerStatus: "NOT_CONNECTED";
  notice: string;
  metrics: {
    totalCampaigns: number;
    draftCampaigns: number;
    scheduledCampaigns: number;
    queuedCampaigns: number;
    completedCampaigns: number;
    cancelledCampaigns: number;
    failedCampaigns: number;
    totalEligibleRecipients: number;
    totalExcludedRecipients: number;
    completedCalls: number;
    failedCalls: number;
    busyCalls: number;
    noAnswerCalls: number;
    cancelledCalls: number;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    purpose: string;
    status: string;
    eligibleCount: number;
    excludedCount: number;
    completedCount: number;
    failedCount: number;
    scheduledAt: Date | null;
    createdAt: Date;
  }>;
  recentCallJobs: Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    destinationPhone: string;
    destinationPhoneNorm: string;
    status: string;
    attemptCount: number;
    failureReason: string | null;
    callDurationSeconds: number | null;
    isSimulated: boolean;
    createdAt: Date;
  }>;
}

export interface ListVoiceCallJobsOptions {
  campaignId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class VoiceReportsService {
  private getDateFilter(range: VoiceReportDateRange): Date | null {
    const now = new Date();
    if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (range === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return null;
  }

  /**
   * Sanitizes spreadsheet cell strings against formula injection (CSV/Excel injection)
   */
  public sanitizeSpreadsheetCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "";
    const str = String(value).trim();
    if (
      str.startsWith("=") ||
      str.startsWith("+") ||
      str.startsWith("-") ||
      str.startsWith("@") ||
      str.startsWith("\t") ||
      str.startsWith("\r")
    ) {
      return `'${str}`;
    }
    return str;
  }

  public escapeCsvField(val: string): string {
    if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  /**
   * Get aggregated overview metrics and recent jobs for voice campaigns
   */
  public async getReportsData(
    workspaceId: string,
    range: VoiceReportDateRange = "30d"
  ): Promise<VoiceReportsData> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const dateThreshold = this.getDateFilter(range);
    const dateWhere = dateThreshold ? { createdAt: { gte: dateThreshold } } : {};

    const [
      campaigns,
      totalCampaigns,
      draftCount,
      scheduledCount,
      queuedCount,
      completedCount,
      cancelledCount,
      failedCount,
      jobs,
      jobCompletedCount,
      jobFailedCount,
      jobBusyCount,
      jobNoAnswerCount,
      jobCancelledCount,
    ] = await Promise.all([
      (prisma as any).voiceCampaign.findMany({
        where: { workspaceId, ...dateWhere },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          purpose: true,
          status: true,
          eligibleCount: true,
          excludedCount: true,
          completedCount: true,
          failedCount: true,
          scheduledAt: true,
          createdAt: true,
        },
      }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, ...dateWhere } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "DRAFT", ...dateWhere } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "SCHEDULED", ...dateWhere } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "QUEUED", ...dateWhere } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "COMPLETED", ...dateWhere } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "CANCELLED", ...dateWhere } }),
      (prisma as any).voiceCampaign.count({ where: { workspaceId, status: "FAILED", ...dateWhere } }),
      (prisma as any).voiceCallJob.findMany({
        where: { workspaceId, ...dateWhere },
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: { select: { name: true } },
        },
      }),
      (prisma as any).voiceCallJob.count({ where: { workspaceId, status: "COMPLETED", ...dateWhere } }),
      (prisma as any).voiceCallJob.count({ where: { workspaceId, status: "FAILED", ...dateWhere } }),
      (prisma as any).voiceCallJob.count({ where: { workspaceId, status: "BUSY", ...dateWhere } }),
      (prisma as any).voiceCallJob.count({ where: { workspaceId, status: "NO_ANSWER", ...dateWhere } }),
      (prisma as any).voiceCallJob.count({ where: { workspaceId, status: "CANCELLED", ...dateWhere } }),
    ]);

    // Aggregate eligible and excluded recipients across campaigns
    const eligibleSum = campaigns.reduce((acc: number, c: any) => acc + (c.eligibleCount || 0), 0);
    const excludedSum = campaigns.reduce((acc: number, c: any) => acc + (c.excludedCount || 0), 0);

    return {
      range,
      isSimulated: true,
      providerStatus: "NOT_CONNECTED",
      notice:
        "All call statistics represent internal workspace campaign jobs and dry-run simulation. No external provider is connected, and real outbound calls are disabled.",
      metrics: {
        totalCampaigns,
        draftCampaigns: draftCount,
        scheduledCampaigns: scheduledCount,
        queuedCampaigns: queuedCount,
        completedCampaigns: completedCount,
        cancelledCampaigns: cancelledCount,
        failedCampaigns: failedCount,
        totalEligibleRecipients: eligibleSum,
        totalExcludedRecipients: excludedSum,
        completedCalls: jobCompletedCount,
        failedCalls: jobFailedCount,
        busyCalls: jobBusyCount,
        noAnswerCalls: jobNoAnswerCount,
        cancelledCalls: jobCancelledCount,
      },
      recentCampaigns: campaigns,
      recentCallJobs: jobs.map((j: any) => ({
        id: j.id,
        campaignId: j.campaignId,
        campaignName: j.campaign?.name || "Untitled Campaign",
        destinationPhone: j.destinationPhone,
        destinationPhoneNorm: j.destinationPhoneNorm,
        status: j.status,
        attemptCount: j.attemptCount,
        failureReason: j.failureReason,
        callDurationSeconds: j.callDurationSeconds,
        isSimulated: j.isSimulated,
        createdAt: j.createdAt,
      })),
    };
  }

  /**
   * List call jobs with filtering and pagination
   */
  public async listCallJobs(workspaceId: string, options: ListVoiceCallJobsOptions = {}) {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (options.campaignId && options.campaignId !== "ALL") {
      where.campaignId = options.campaignId;
    }

    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { destinationPhone: { contains: q, mode: "insensitive" } },
        { destinationPhoneNorm: { contains: q, mode: "insensitive" } },
        { campaign: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      (prisma as any).voiceCallJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true, email: true } },
        },
      }),
      (prisma as any).voiceCallJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Export call jobs to CSV with formula injection protection
   */
  public async exportJobsCsv(workspaceId: string, campaignId?: string): Promise<string> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    const where: any = { workspaceId };
    if (campaignId && campaignId !== "ALL") {
      where.campaignId = campaignId;
    }

    const jobs = await (prisma as any).voiceCallJob.findMany({
      where,
      take: 2000,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { name: true } },
      },
    });

    const headers = [
      "Job ID",
      "Campaign Name",
      "Destination Phone (E.164)",
      "Status",
      "Attempt Count",
      "Duration (Sec)",
      "Scheduled At",
      "Created At",
      "Failure Reason",
      "Execution Mode",
    ];

    const rows = [headers.join(",")];

    for (const j of jobs) {
      const cells = [
        this.sanitizeSpreadsheetCell(j.id),
        this.sanitizeSpreadsheetCell(j.campaign?.name || "N/A"),
        this.sanitizeSpreadsheetCell(j.destinationPhoneNorm),
        this.sanitizeSpreadsheetCell(j.status),
        this.sanitizeSpreadsheetCell(j.attemptCount),
        this.sanitizeSpreadsheetCell(j.callDurationSeconds || 0),
        this.sanitizeSpreadsheetCell(j.scheduledAt ? new Date(j.scheduledAt).toISOString() : "Immediate"),
        this.sanitizeSpreadsheetCell(new Date(j.createdAt).toISOString()),
        this.sanitizeSpreadsheetCell(j.failureReason || "None"),
        this.sanitizeSpreadsheetCell(j.isSimulated ? "Internal Simulation" : "Provider Call"),
      ];
      rows.push(cells.map((c) => this.escapeCsvField(c)).join(","));
    }

    return rows.join("\n");
  }
}

export const voiceReportsService = new VoiceReportsService();
