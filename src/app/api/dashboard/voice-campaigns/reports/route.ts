import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { voiceReportsService, VoiceReportDateRange } from "@/lib/services/voice-reports";

export async function GET(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") || "30d") as VoiceReportDateRange;

    const data = await voiceReportsService.getReportsData(auth.workspace.id, range);
    return NextResponse.json({ success: true, reports: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load voice reports" },
      { status: 500 }
    );
  }
}
