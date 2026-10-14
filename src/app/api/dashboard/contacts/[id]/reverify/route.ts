import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { contactsService } from "@/lib/services/contacts";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    const result = await contactsService.reverifyContact(
      auth.workspace.id,
      id,
      auth.user.id
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Re-verification failed" },
      { status: 400 }
    );
  }
}
