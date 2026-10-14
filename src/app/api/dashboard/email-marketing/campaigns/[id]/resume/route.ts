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

    const { id } = await context.params;
    const resumed = await campaignService.resumeCampaign(id, auth.workspace.id);

    return NextResponse.json({
      success: true,
      data: resumed,
      message: "Campaign sending resumed successfully.",
    });
  } catch (err: any) {
    console.error("Resume Campaign Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to resume campaign" },
      { status: 500 }
    );
  }
}
