import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { contactsService } from "@/lib/services/contacts";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email query parameter is required" }, { status: 400 });
    }

    const contact = await contactsService.lookupContactByEmail(auth.workspace.id, email);
    return NextResponse.json({ success: true, exists: !!contact, contact });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Lookup failed" },
      { status: 500 }
    );
  }
}
