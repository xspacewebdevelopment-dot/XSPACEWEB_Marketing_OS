import { NextRequest, NextResponse } from "next/server";
import { campaignService } from "@/lib/services/campaigns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unsubscribe token is required" }, { status: 400 });
    }

    const result = await campaignService.handleUnsubscribe(token);

    return NextResponse.json({
      success: true,
      data: result,
      message: "You have been successfully unsubscribed from this sender's marketing emails.",
    });
  } catch (err: any) {
    console.error("Public Unsubscribe GET Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process unsubscribe request" },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let token = searchParams.get("token");

    if (!token) {
      const body = await request.json().catch(() => ({}));
      token = body.token;
    }

    if (!token) {
      return NextResponse.json({ error: "Unsubscribe token is required" }, { status: 400 });
    }

    const result = await campaignService.handleUnsubscribe(token);

    return NextResponse.json({
      success: true,
      data: result,
      message: "One-click unsubscribe completed. Recipient immediately added to suppression list.",
    });
  } catch (err: any) {
    console.error("Public Unsubscribe POST Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process unsubscribe request" },
      { status: 400 }
    );
  }
}
