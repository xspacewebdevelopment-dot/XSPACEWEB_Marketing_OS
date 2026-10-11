import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reoonClient } from "@/lib/reoon/client";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const balance = await reoonClient.getAccountBalance(forceRefresh);

    const response = NextResponse.json({
      success: true,
      data: balance,
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

    const msg = err instanceof Error ? err.message : "Failed to retrieve credit balance";
    return NextResponse.json(
      { success: false, error: msg, code: "CREDIT_ERROR" },
      { status: 500 }
    );
  }
}
