import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { voiceReportsService } from "@/lib/services/voice-reports";

export async function GET(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "20", 10) || 20;

    const data = await voiceReportsService.listCallJobs(auth.workspace.id, {
      campaignId,
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load call jobs" },
      { status: 500 }
    );
  }
}
