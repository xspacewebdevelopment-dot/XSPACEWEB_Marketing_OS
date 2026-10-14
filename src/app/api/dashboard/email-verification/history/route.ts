import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verificationService } from "@/lib/services/verification";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "15", 10) || 15;
    const search = searchParams.get("search") || undefined;
    const typeParam = searchParams.get("type");
    const type = typeParam === "single" || typeParam === "bulk" ? typeParam : "all";

    const data = await verificationService.getUnifiedHistory(auth.workspace.id, {
      page,
      limit,
      search,
      type,
    });

    const response = NextResponse.json({
      success: true,
      data,
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

    const msg = err instanceof Error ? err.message : "Failed to load verification history";
    return NextResponse.json(
      { success: false, error: msg, code: "QUERY_ERROR" },
      { status: 500 }
    );
  }
}
