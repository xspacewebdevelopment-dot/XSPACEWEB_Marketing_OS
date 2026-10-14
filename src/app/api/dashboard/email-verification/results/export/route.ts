import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resultsCleaningService } from "@/lib/services/results-cleaning";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { format = "csv", exportType = "all", selectedIds, cleaningRules, filters } = body;

    if (format !== "csv" && format !== "xlsx") {
      return NextResponse.json(
        { success: false, error: "Unsupported export format. Choose 'csv' or 'xlsx'." },
        { status: 400 }
      );
    }

    const exportData = await resultsCleaningService.exportResults(auth.workspace.id, {
      format,
      exportType,
      selectedIds,
      cleaningRules,
      filters,
    });

    if (format === "xlsx" && exportData.buffer) {
      return new NextResponse(exportData.buffer as any, {
        status: 200,
        headers: {
          "Content-Type": exportData.contentType,
          "Content-Disposition": `attachment; filename="${exportData.filename}"`,
          "X-Total-Exported": String(exportData.totalExported),
        },
      });
    } else {
      return new NextResponse(exportData.content || "", {
        status: 200,
        headers: {
          "Content-Type": exportData.contentType,
          "Content-Disposition": `attachment; filename="${exportData.filename}"`,
          "X-Total-Exported": String(exportData.totalExported),
        },
      });
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to generate export";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
