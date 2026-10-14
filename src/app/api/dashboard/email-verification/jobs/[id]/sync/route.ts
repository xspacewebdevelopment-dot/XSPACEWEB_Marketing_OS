import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verificationService, VerificationServiceError } from "@/lib/services/verification";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await context.params;

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
