import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verificationService, VerificationServiceError } from "@/lib/services/verification";
import { resultsCleaningService } from "@/lib/services/results-cleaning";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await context.params;

    const result = await resultsCleaningService.getResultDetails(id, auth.workspace.id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Verification record not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to load verification record";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await context.params;

    const result = await verificationService.deleteSingleVerification(id, auth.workspace.id);

    return NextResponse.json({
      success: true,
      message: "Verification record deleted successfully",
      data: result,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (err instanceof VerificationServiceError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    const msg = err instanceof Error ? err.message : "Failed to delete verification record";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
