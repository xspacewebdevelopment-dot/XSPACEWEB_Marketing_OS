import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { campaignService } from "@/lib/services/campaigns";
import { createCampaignSchema } from "@/lib/types/campaigns";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const type = searchParams.get("type") || "ALL";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const isArchived = searchParams.get("archived") === "true";

    const workspaceId = auth.workspace.id;

    // Fetch campaigns list
    const result = await campaignService.listCampaigns(workspaceId, {
      status,
      type,
      search,
      page,
      limit,
      isArchived,
    });

    // Calculate aggregated KPIs strictly from real stored database counts
    const [
      totalCampaigns,
      aggregateStats,
      draftCount,
      scheduledCount,
      sendingCount,
      sentCount,
      failedCount,
      archivedCount,
    ] = await Promise.all([
      prisma.campaign.count({
        where: { workspaceId, isArchived: false },
      }),
      prisma.campaign.aggregate({
        where: { workspaceId },
        _sum: {
          submittedCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true,
          bouncedCount: true,
        },
      }),
      prisma.campaign.count({
        where: { workspaceId, status: "DRAFT", isArchived: false },
      }),
      prisma.campaign.count({
        where: { workspaceId, status: "SCHEDULED", isArchived: false },
      }),
      prisma.campaign.count({
        where: { workspaceId, status: { in: ["SENDING", "QUEUED"] }, isArchived: false },
      }),
      prisma.campaign.count({
        where: { workspaceId, status: "COMPLETED", isArchived: false },
      }),
      prisma.campaign.count({
        where: { workspaceId, status: "FAILED", isArchived: false },
      }),
      prisma.campaign.count({
        where: { workspaceId, isArchived: true },
      }),
    ]);

    const sumStats = aggregateStats?._sum || {};
    const kpis = {
      totalCampaigns: totalCampaigns || 0,
      emailsSubmitted: sumStats.submittedCount || 0,
      delivered: sumStats.deliveredCount || 0,
      opens: sumStats.openedCount || 0,
      clicks: sumStats.clickedCount || 0,
      bounces: sumStats.bouncedCount || 0,
      tabs: {
        all: totalCampaigns || 0,
        drafts: draftCount || 0,
        scheduled: scheduledCount || 0,
        sending: sendingCount || 0,
        sent: sentCount || 0,
        failed: failedCount || 0,
        archived: archivedCount || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: result.campaigns,
      pagination: result.pagination,
      kpis,
    });
  } catch (err: any) {
    console.error("Campaigns GET Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCampaignSchema.parse(body);

    const campaign = await campaignService.createCampaign(
      auth.workspace.id,
      auth.user.id,
      validated
    );

    return NextResponse.json(
      {
        success: true,
        data: campaign,
        message: "Campaign created successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Campaigns POST Error:", err);
    if (err instanceof z.ZodError) {
      const issue = (err as any).issues?.[0] || (err as any).errors?.[0];
      return NextResponse.json(
        { error: issue?.message || "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}
