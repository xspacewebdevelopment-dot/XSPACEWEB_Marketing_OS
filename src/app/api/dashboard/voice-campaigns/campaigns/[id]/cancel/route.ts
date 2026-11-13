import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { voiceCampaignService } from "@/lib/services/voice-campaigns";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const cancelled = await voiceCampaignService.cancelScheduledCampaign(id, auth.workspace.id);

    return NextResponse.json({ success: true, campaign: cancelled });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error.message?.includes("Cannot cancel")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel scheduled campaign" },
      { status: 500 }
    );
  }
}
