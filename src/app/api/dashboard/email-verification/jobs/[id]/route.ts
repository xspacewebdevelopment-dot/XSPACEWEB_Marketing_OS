import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verificationService, VerificationServiceError } from "@/lib/services/verification";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await context.params;

    // Check if client explicitly requests live sync
    const job = await verificationService.pollJobStatus(id, auth.workspace.id);

    return NextResponse.json({
      success: true,
      data: job,
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

    const msg = err instanceof Error ? err.message : "Internal error";
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
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const purge = searchParams.get("purge") === "true";

    if (action === "delete" || purge) {
      const deleted = await verificationService.deleteJob(id, auth.workspace.id);
      return NextResponse.json({
        success: true,
        message: "Verification job and associated records deleted successfully",
        data: deleted,
      });
    }

    // Default DELETE on active jobs cancels them
    try {
      const job = await verificationService.cancelJob(id, auth.workspace.id);
      return NextResponse.json({
        success: true,
        data: job,
        notice:
          "Job marked cancelled locally. Note: Reoon does not support remote abort of tasks already submitted to verification servers.",
      });
    } catch (cancelErr: unknown) {
      // If job is already completed/failed/cancelled, fall back to permanent deletion
      if (
        cancelErr instanceof VerificationServiceError &&
        cancelErr.code === "ALREADY_COMPLETED"
      ) {
        const deleted = await verificationService.deleteJob(id, auth.workspace.id);
        return NextResponse.json({
          success: true,
          message: "Verification job deleted successfully",
          data: deleted,
        });
      }
      throw cancelErr;
    }
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

    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
