import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { suppressionService } from "@/lib/services/suppression";

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireAuth();
    const stats = await suppressionService.getSuppressionStats(auth.workspace.id);
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch suppression stats" },
      { status: 500 }
    );
  }
}
