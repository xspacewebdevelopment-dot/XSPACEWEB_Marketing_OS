import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { smsTemplateService } from "@/lib/services/sms-templates";

export async function POST(_req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await smsTemplateService.seedStarterTemplates(
      auth.workspace.id,
      auth.user.id
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add starter templates" },
      { status: 500 }
    );
  }
}
