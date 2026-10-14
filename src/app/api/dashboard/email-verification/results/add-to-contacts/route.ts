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
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { resultIds, cleanedOnly, cleaningRules, filters, listId } = body;

    const result = await resultsCleaningService.addResultsToContacts(auth.workspace.id, {
      resultIds,
      cleanedOnly,
      cleaningRules,
      filters,
      listId,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed contacts: ${result.addedCount} new added, ${result.updatedCount} verification statuses updated. (${result.skippedSuppressedCount} suppressed skipped).`,
      data: result,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to import contacts";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
