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
      // empty body defaults to default rules
    }

    const { filters, selectedIds, cleaningRules } = body;

    const cleaned = await resultsCleaningService.cleanList(auth.workspace.id, {
      filters,
      selectedIds,
      cleaningRules,
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: cleaned.metrics,
        rulesApplied: cleaned.rulesApplied,
        samplePreview: cleaned.eligibleRecords.slice(0, 5),
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to compute list cleaning";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
