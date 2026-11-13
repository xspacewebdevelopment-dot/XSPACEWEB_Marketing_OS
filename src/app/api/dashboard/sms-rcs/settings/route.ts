/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { smsSettingsService } from "@/lib/services/sms-settings";

export async function GET() {
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

    // Scoped strictly to authenticated workspace ID
    const settings = await smsSettingsService.getSettings(auth.workspace.id);

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load SMS & RCS settings",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();

    // Never trust a client-supplied workspace ID; strictly enforce auth.workspace.id
    const updated = await smsSettingsService.updateSettings(
      auth.workspace.id,
      body
    );

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    const isValidationError =
      error.message?.includes("Invalid") ||
      error.message?.includes("required") ||
      error.message?.includes("must be") ||
      error.message?.includes("cannot");

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update SMS & RCS settings",
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
