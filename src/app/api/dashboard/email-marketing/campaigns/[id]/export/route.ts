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
    const csvContent = await campaignService.exportReportCsv(id, auth.workspace.id);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="campaign-${id}-report.csv"`,
      },
    });
  } catch (err: any) {
    console.error("Export Report Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to export campaign report" },
      { status: 500 }
    );
  }
}
