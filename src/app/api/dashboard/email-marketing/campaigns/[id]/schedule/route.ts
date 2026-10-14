import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { campaignService } from "@/lib/services/campaigns";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (auth.role !== "OWNER" && auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only workspace Owners or Admins are authorized to schedule campaign sends." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (!body.confirmed) {
      return NextResponse.json(
        { error: "Explicit user confirmation is required to schedule campaign sending." },
        { status: 400 }
      );
    }

    if (!body.scheduledAt) {
      return NextResponse.json(
        { error: "A valid scheduled datetime string is required." },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(body.scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be a valid future datetime." },
        { status: 400 }
      );
    }

    const timezone = body.timezone || "UTC";

    const scheduled = await campaignService.scheduleCampaign(
      id,
      auth.workspace.id,
      scheduledDate,
      timezone
    );

    return NextResponse.json({
      success: true,
      data: scheduled,
      message: `Campaign scheduled for ${scheduledDate.toUTCString()}`,
    });
  } catch (err: any) {
    console.error("Campaign Schedule Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to schedule campaign" },
      { status: 500 }
    );
  }
}
