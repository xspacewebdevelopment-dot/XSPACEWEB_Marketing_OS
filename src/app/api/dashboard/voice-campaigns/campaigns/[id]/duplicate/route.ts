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
    const duplicated = await voiceCampaignService.duplicateCampaign(
      id,
      auth.workspace.id,
      auth.user.id
    );

    return NextResponse.json({ success: true, campaign: duplicated }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to duplicate campaign" },
      { status: 500 }
    );
  }
}
