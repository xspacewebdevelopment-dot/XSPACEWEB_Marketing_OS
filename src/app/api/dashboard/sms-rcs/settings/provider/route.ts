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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const status = await smsSettingsService.getProviderStatus(auth.workspace.id);
    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load provider status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (body.action !== "test_connection") {
      return NextResponse.json(
        { success: false, error: "Invalid action. Supported actions: test_connection" },
        { status: 400 }
      );
    }

    const result = await smsSettingsService.testProviderConnection(auth.workspace.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test provider connection" },
      { status: 500 }
    );
  }
}
