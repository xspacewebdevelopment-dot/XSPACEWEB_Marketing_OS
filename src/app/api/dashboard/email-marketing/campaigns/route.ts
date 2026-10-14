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

    // Calculate aggregated KPIs safely
    let totalCampaigns = 0;
    let draftCount = 0;
    let scheduledCount = 0;
    let sendingCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    let archivedCount = 0;
    let emailsSubmitted = 0;
    let delivered = 0;
    let opens = 0;
    let clicks = 0;
    let bounces = 0;

    try {
      const counts = await Promise.all([
        prisma.campaign.count({ where: { workspaceId, isArchived: false } }),
        prisma.campaign.count({ where: { workspaceId, status: "DRAFT", isArchived: false } }),
        prisma.campaign.count({ where: { workspaceId, status: "SCHEDULED", isArchived: false } }),
        prisma.campaign.count({ where: { workspaceId, status: { in: ["SENDING", "QUEUED"] }, isArchived: false } }),
        prisma.campaign.count({ where: { workspaceId, status: "COMPLETED", isArchived: false } }),
        prisma.campaign.count({ where: { workspaceId, status: "FAILED", isArchived: false } }),
        prisma.campaign.count({ where: { workspaceId, isArchived: true } }),
      ]);

      totalCampaigns = counts[0] || 0;
      draftCount = counts[1] || 0;
      scheduledCount = counts[2] || 0;
      sendingCount = counts[3] || 0;
      sentCount = counts[4] || 0;
      failedCount = counts[5] || 0;
      archivedCount = counts[6] || 0;

      if (totalCampaigns > 0) {
        const aggregateStats = await prisma.campaign.aggregate({
          where: { workspaceId },
          _sum: {
            submittedCount: true,
            deliveredCount: true,
            openedCount: true,
            clickedCount: true,
            bouncedCount: true,
          },
        });
        emailsSubmitted = aggregateStats._sum?.submittedCount || 0;
        delivered = aggregateStats._sum?.deliveredCount || 0;
        opens = aggregateStats._sum?.openedCount || 0;
        clicks = aggregateStats._sum?.clickedCount || 0;
        bounces = aggregateStats._sum?.bouncedCount || 0;
      }
    } catch (kpiErr) {
      console.warn("KPI aggregate query warning:", kpiErr);
    }

    const kpis = {
      totalCampaigns,
      emailsSubmitted,
      delivered,
      opens,
      clicks,
      bounces,
      tabs: {
        all: totalCampaigns,
        drafts: draftCount,
        scheduled: scheduledCount,
        sending: sendingCount,
        sent: sentCount,
        failed: failedCount,
        archived: archivedCount,
      },
    };

    return NextResponse.json({
      success: true,
      data: result?.campaigns || [],
      pagination: result?.pagination || { page, limit, total: 0, totalPages: 1 },
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
