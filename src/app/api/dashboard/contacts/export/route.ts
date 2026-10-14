import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { contactsService } from "@/lib/services/contacts";
import type { ContactQueryOptions } from "@/lib/types/contacts";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body optional
    }

    const options: ContactQueryOptions = {
      search: body.search || undefined,
      verificationStatus: body.verificationStatus || undefined,
      suppressionStatus: body.suppressionStatus || undefined,
      subscriptionStatus: body.subscriptionStatus || undefined,
      listId: body.listId || undefined,
      tag: body.tag || undefined,
    };

    const format = body.format === "xlsx" ? "xlsx" : "csv";
    const exportResult = await contactsService.exportContacts(
      auth.workspace.id,
      options,
      format
    );

    return new NextResponse(exportResult.data as any, {
      status: 200,
      headers: {
        "Content-Type": exportResult.contentType,
        "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
        "X-Row-Count": String(exportResult.rowCount),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export contacts" },
      { status: 500 }
    );
  }
}
