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

    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "all") as
      | "all"
      | "valid"
      | "invalid"
      | "risky"
      | "deliverable";

    const { filename, csv } = await verificationService.exportJobResultsCsv(
      id,
      auth.workspace.id,
      filter
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
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
