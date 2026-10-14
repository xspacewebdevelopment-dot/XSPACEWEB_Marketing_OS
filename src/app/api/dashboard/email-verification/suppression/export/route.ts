import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { suppressionService } from "@/lib/services/suppression";
import type { SuppressionQueryOptions } from "@/lib/types/suppression";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const options: SuppressionQueryOptions = {
      search: body.search || undefined,
      reason: body.reason || undefined,
      source: body.source || undefined,
      status: body.status || "ACTIVE",
    };

    const { csvContent, rowCount } = await suppressionService.exportSuppressionsToCsv(
      auth.workspace.id,
      options
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `nexareach_suppression_list_${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Row-Count": String(rowCount),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export suppressions" },
      { status: 500 }
    );
  }
}
