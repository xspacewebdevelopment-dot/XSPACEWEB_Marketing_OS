import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { campaignService } from "@/lib/services/campaigns";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const monitorData = await campaignService.getMonitorData(id, auth.workspace.id);

    return NextResponse.json({
      success: true,
      data: monitorData,
    });
  } catch (err: any) {
    console.error("Monitor Data Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve monitor data" },
      { status: 500 }
    );
  }
}
