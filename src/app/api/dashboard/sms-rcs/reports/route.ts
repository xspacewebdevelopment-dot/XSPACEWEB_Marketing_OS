/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { smsReportService, SmsReportDateRange } from "@/lib/services/sms-reports";

export async function GET(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawRange = searchParams.get("range") || "30d";

    // Validate date range param, falling back to 30d safely
    const validRanges: SmsReportDateRange[] = ["7d", "30d", "90d", "all"];
    const range: SmsReportDateRange = validRanges.includes(rawRange as SmsReportDateRange)
      ? (rawRange as SmsReportDateRange)
      : "30d";

    // Fetch reports strictly scoped to authenticated workspace ID
    const reports = await smsReportService.getWorkspaceReports(
      auth.workspace.id,
      range
    );

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate SMS & RCS reports",
      },
      { status: 500 }
    );
  }
}
