import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { campaignService } from "@/lib/services/campaigns";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const testEmail = body.testEmail || body.email;

    if (!testEmail || !testEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid test recipient email address is required" },
        { status: 400 }
      );
    }

    const result = await campaignService.sendTestEmail(
      id,
      auth.workspace.id,
      testEmail.trim()
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to dispatch test email via Resend",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test email successfully submitted to ${testEmail}`,
    });
  } catch (err: any) {
    console.error("Test Send Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
