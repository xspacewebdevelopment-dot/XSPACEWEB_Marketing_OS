/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { smsCampaignService } from "@/lib/services/sms-campaigns";

export async function POST(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const {
      phone,
      messageText,
      route,
      senderId,
      dltTemplateId,
      variablesValues,
      confirmLiveSend,
      attestedConsent,
    } = body;

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Recipient phone number is required" },
        { status: 400 }
      );
    }

    if (!messageText || typeof messageText !== "string" || !messageText.trim()) {
      return NextResponse.json(
        { success: false, error: "Message text is required" },
        { status: 400 }
      );
    }

    // Explicit confirmation guard: prevents accidental billable sends
    if (confirmLiveSend !== true) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Live send confirmation required. You must explicitly confirm (confirmLiveSend: true) before a billable SMS is dispatched.",
        },
        { status: 400 }
      );
    }

    const result = await smsCampaignService.executeSingleTestSend(auth.workspace.id, {
      phone,
      messageText,
      route,
      senderId,
      dltTemplateId,
      variablesValues,
      confirmLiveSend: true,
      attestedConsent: Boolean(attestedConsent),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const status =
      error.message?.includes("suppressed") ||
      error.message?.includes("consent") ||
      error.message?.includes("required") ||
      error.message?.includes("only supports") ||
      error.message?.includes("Invalid")
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute test SMS dispatch",
      },
      { status }
    );
  }
}
