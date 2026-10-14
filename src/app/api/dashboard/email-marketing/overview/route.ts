import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") || "30d"; // 7d, 30d, 90d
    const days = rangeParam === "7d" ? 7 : rangeParam === "90d" ? 90 : 30;

    const workspaceId = auth.workspace.id;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // 1. Contacts & Audience Breakdown
    const [
      totalContacts,
      subscribedContacts,
      pendingContacts,
      unsubscribedContacts,
      bouncedContacts,
      unverifiedContacts,
      validContacts,
      riskyContacts,
      invalidContacts,
    ] = await Promise.all([
      prisma.contact.count({ where: { workspaceId, isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, subscriptionStatus: "SUBSCRIBED", isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, subscriptionStatus: "PENDING", isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, subscriptionStatus: "UNSUBSCRIBED", isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, subscriptionStatus: "BOUNCED", isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, verificationStatus: "UNVERIFIED", isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, verificationStatus: "VALID", isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, verificationStatus: "RISKY", isArchived: false } }),
      prisma.contact.count({ where: { workspaceId, verificationStatus: "INVALID", isArchived: false } }),
    ]);

    // 2. Campaigns Breakdown
    const [
      totalCampaigns,
      draftCampaigns,
      scheduledCampaigns,
      sendingCampaigns,
      completedCampaigns,
      failedCampaigns,
      cancelledCampaigns,
    ] = await Promise.all([
      prisma.campaign.count({ where: { workspaceId, isArchived: false } }),
      prisma.campaign.count({ where: { workspaceId, status: "DRAFT", isArchived: false } }),
      prisma.campaign.count({ where: { workspaceId, status: { in: ["SCHEDULED", "QUEUED"] }, isArchived: false } }),
      prisma.campaign.count({ where: { workspaceId, status: "SENDING", isArchived: false } }),
      prisma.campaign.count({ where: { workspaceId, status: "COMPLETED", isArchived: false } }),
      prisma.campaign.count({ where: { workspaceId, status: "FAILED", isArchived: false } }),
      prisma.campaign.count({ where: { workspaceId, status: "CANCELLED", isArchived: false } }),
    ]);

    // 3. Aggregate Delivery and Engagement from Campaigns
    const campaignAgg = await prisma.campaign.aggregate({
      where: { workspaceId, isArchived: false },
      _sum: {
        submittedCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        complainedCount: true,
        unsubscribedCount: true,
        failedCount: true,
      },
    });

    const submitted = campaignAgg._sum.submittedCount || 0;
    const delivered = campaignAgg._sum.deliveredCount || 0;
    const opened = campaignAgg._sum.openedCount || 0;
    const clicked = campaignAgg._sum.clickedCount || 0;
    const bounced = campaignAgg._sum.bouncedCount || 0;
    const complained = campaignAgg._sum.complainedCount || 0;
    const unsubscribed = campaignAgg._sum.unsubscribedCount || 0;

    // Delivery rates (only computed when genuine denominator exists)
    const confirmedDeliveryRate = submitted > 0 ? Number(((delivered / submitted) * 100).toFixed(1)) : 0;
    const openRate = delivered > 0 ? Number(((opened / delivered) * 100).toFixed(1)) : 0;
    const clickRate = delivered > 0 ? Number(((clicked / delivered) * 100).toFixed(1)) : 0;
    const bounceRate = submitted > 0 ? Number(((bounced / submitted) * 100).toFixed(2)) : 0;

    // 4. Email Verification Summary (Reoon results in workspace)
    const verificationResults = await prisma.verificationResult.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: true,
    });

    const verificationCounts = {
      valid: 0,
      invalid: 0,
      risky: 0,
      unknown: 0,
      total: 0,
    };

    verificationResults.forEach((r) => {
      const s = r.status.toLowerCase();
      if (s === "valid") verificationCounts.valid = r._count;
      else if (s === "invalid") verificationCounts.invalid = r._count;
      else if (s === "risky") verificationCounts.risky = r._count;
      else if (s === "unknown") verificationCounts.unknown = r._count;
      verificationCounts.total += r._count;
    });

    const totalVerificationJobs = await prisma.verificationJob.count({
      where: { workspaceId },
    });

    // 5. Suppression List Summary
    const activeSuppressions = await prisma.suppressionEntry.count({
      where: { workspaceId, status: "ACTIVE" },
    });

    const suppressionBreakdown = await prisma.suppressionEntry.groupBy({
      by: ["reason"],
      where: { workspaceId, status: "ACTIVE" },
      _count: true,
    });

    const suppressionsByReason: Record<string, number> = {};
    suppressionBreakdown.forEach((b) => {
      suppressionsByReason[b.reason] = b._count;
    });

    // 6. Deliverability Health & Real Actionable Recommendations
    const warnings: { id: string; level: "info" | "warning" | "danger"; title: string; detail: string; actionUrl?: string; actionLabel?: string }[] = [];

    if (unverifiedContacts > 0) {
      warnings.push({
        id: "unverified_contacts",
        level: unverifiedContacts > 50 ? "warning" : "info",
        title: `${unverifiedContacts} Unverified Contact${unverifiedContacts > 1 ? "s" : ""}`,
        detail: "Sending campaigns to unverified email addresses increases bounce risks and lowers inbox placement.",
        actionUrl: "/dashboard/email-verification",
        actionLabel: "Verify Contacts",
      });
    }

    if (bounceRate > 5) {
      warnings.push({
        id: "high_bounce_rate",
        level: "danger",
        title: `High Bounce Rate (${bounceRate}%)`,
        detail: "Industry standard requires bounce rates under 5.0%. Clean your lists immediately to protect domain reputation.",
        actionUrl: "/dashboard/email-verification",
        actionLabel: "Clean Lists",
      });
    }

    if (activeSuppressions > 0) {
      warnings.push({
        id: "suppression_active",
        level: "info",
        title: `${activeSuppressions} Active Suppressions Protected`,
        detail: "NexaReach automatically excludes bounced, complained, and unsubscribed addresses from all dispatches.",
        actionUrl: "/dashboard/email-verification/suppression",
        actionLabel: "Manage Suppression",
      });
    }

    // Deliverability reputation score calculation (0 - 100)
    let reputationScore = 100;
    if (bounceRate > 5) reputationScore -= 30;
    else if (bounceRate > 2) reputationScore -= 15;

    if (unverifiedContacts > 0 && totalContacts > 0) {
      const unverifiedRatio = unverifiedContacts / totalContacts;
      if (unverifiedRatio > 0.5) reputationScore -= 20;
      else if (unverifiedRatio > 0.2) reputationScore -= 10;
    }

    if (complained > 0) reputationScore -= 25;
    reputationScore = Math.max(20, Math.min(100, reputationScore));

    const reputationGrade =
      reputationScore >= 90 ? "Excellent" : reputationScore >= 75 ? "Good" : reputationScore >= 60 ? "Fair" : "At Risk";

    // 7. Recent Campaigns (Top 5)
    const recentCampaigns = await prisma.campaign.findMany({
      where: { workspaceId, isArchived: false },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        subject: true,
        fromEmail: true,
        fromName: true,
        totalRecipients: true,
        submittedCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 8. Recent Persisted Email Activity (EmailEvent records)
    const recentActivity = await prisma.emailEvent.findMany({
      where: { campaign: { workspaceId } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 9. Performance Timeline (Daily metrics within date range)
    // Gather events grouped by day
    const eventsInRange = await prisma.emailEvent.findMany({
      where: {
        campaign: { workspaceId },
        createdAt: { gte: sinceDate },
      },
      select: {
        eventType: true,
        createdAt: true,
      },
    });

    // Build day-by-day map
    const dateMap: Record<string, { date: string; label: string; submitted: number; delivered: number; opened: number; clicked: number; bounced: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dateMap[iso] = { date: iso, label, submitted: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    }

    eventsInRange.forEach((evt) => {
      const dayKey = evt.createdAt.toISOString().split("T")[0];
      if (dateMap[dayKey]) {
        if (evt.eventType === "SUBMITTED") dateMap[dayKey].submitted += 1;
        else if (evt.eventType === "DELIVERED") dateMap[dayKey].delivered += 1;
        else if (evt.eventType === "OPENED") dateMap[dayKey].opened += 1;
        else if (evt.eventType === "CLICKED") dateMap[dayKey].clicked += 1;
        else if (evt.eventType === "BOUNCED") dateMap[dayKey].bounced += 1;
      }
    });

    const performanceTimeline = Object.values(dateMap);

    return NextResponse.json({
      success: true,
      data: {
        range: rangeParam,
        contacts: {
          total: totalContacts,
          subscribed: subscribedContacts,
          pending: pendingContacts,
          unsubscribed: unsubscribedContacts,
          bounced: bouncedContacts,
          unverified: unverifiedContacts,
          valid: validContacts,
          risky: riskyContacts,
          invalid: invalidContacts,
        },
        campaigns: {
          total: totalCampaigns,
          drafts: draftCampaigns,
          scheduled: scheduledCampaigns,
          sending: sendingCampaigns,
          sent: completedCampaigns,
          failed: failedCampaigns,
          cancelled: cancelledCampaigns,
        },
        delivery: {
          submitted,
          delivered,
          opened,
          clicked,
          bounced,
          complained,
          unsubscribed,
          rates: {
            confirmedDeliveryRate,
            openRate,
            clickRate,
            bounceRate,
          },
        },
        verification: {
          ...verificationCounts,
          totalJobs: totalVerificationJobs,
        },
        suppression: {
          totalActive: activeSuppressions,
          byReason: suppressionsByReason,
        },
        deliverability: {
          score: reputationScore,
          grade: reputationGrade,
          warnings,
        },
        performanceTimeline,
        recentCampaigns,
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          recipientEmail: a.recipientEmail,
          eventType: a.eventType,
          provider: a.provider,
          createdAt: a.createdAt,
          campaignId: a.campaignId,
          campaignName: a.campaign.name,
        })),
      },
    });
  } catch (err: any) {
    console.error("Email Marketing Overview API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load email marketing overview metrics" },
      { status: 500 }
    );
  }
}
