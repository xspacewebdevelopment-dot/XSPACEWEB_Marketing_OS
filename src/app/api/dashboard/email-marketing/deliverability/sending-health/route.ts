import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "25", 10)));
    const statusFilter = searchParams.get("status"); // SENT, DELIVERED, BOUNCED, COMPLAINED, FAILED

    const workspaceId = auth.workspace.id;
    const where: Prisma.EmailSendRecordWhereInput = { workspaceId };

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    const hasEmailSendRecord = Boolean(prisma.emailSendRecord?.count);
    const hasEmailWebhookEvent = Boolean(prisma.emailWebhookEvent?.count);

    if (!hasEmailSendRecord) {
      return NextResponse.json({
        success: true,
        counts: { TOTAL: 0, SENT: 0, DELIVERED: 0, BOUNCED: 0, COMPLAINED: 0, FAILED: 0 },
        hasWebhookConfirmation: false,
        webhookEventsCount: 0,
        rateDefinitions: {
          deliveryRate: "Delivered / Sent confirmed by Resend webhook delivery events.",
          bounceRate: "Bounces / Sent. Target: < 2.0% (strict ISP limit).",
          complaintRate: "Spam complaints / Sent. Target: < 0.1% (Gmail & Yahoo enforcement threshold).",
        },
        pagination: { page, limit, total: 0, totalPages: 1 },
        items: [],
      });
    }

    const [total, items, stats] = await Promise.all([
      prisma.emailSendRecord.count({ where }),
      prisma.emailSendRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailSendRecord.groupBy({
        by: ["status"],
        where: { workspaceId },
        _count: { id: true },
      }),
    ]);

    const counts: Record<string, number> = {
      TOTAL: 0,
      SENT: 0,
      DELIVERED: 0,
      BOUNCED: 0,
      COMPLAINED: 0,
      FAILED: 0,
    };

    for (const s of stats) {
      counts[s.status] = s._count.id;
      counts.TOTAL += s._count.id;
    }

    const webhookEventsCount = await prisma.emailWebhookEvent.count({
      where: { workspaceId },
    });

    const hasWebhookConfirmation = webhookEventsCount > 0 || counts.DELIVERED > 0;

    return NextResponse.json({
      success: true,
      counts,
      hasWebhookConfirmation,
      webhookEventsCount,
      rateDefinitions: {
        deliveryRate: "Calculated as (Delivered Emails / Sent Emails) * 100. Delivered status requires Resend webhook 'email.delivered' event.",
        bounceRate: "Calculated as (Bounced Emails / Sent Emails) * 100. Healthy deliverability requires maintaining under 2.0%.",
        complaintRate: "Calculated as (Spam Complaints / Sent Emails) * 100. Senders must maintain under 0.10% (ideally under 0.05%).",
      },
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load sending health";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
