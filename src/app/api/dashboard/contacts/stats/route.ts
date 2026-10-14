import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { contactsService } from "@/lib/services/contacts";

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireAuth();
    const stats = await contactsService.getContactStats(auth.workspace.id);
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch contact statistics" },
      { status: 500 }
    );
  }
}
