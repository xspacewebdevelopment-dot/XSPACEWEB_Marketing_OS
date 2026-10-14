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

    // Role-based authorization for production sending
    if (auth.role !== "OWNER" && auth.role !== "ADMIN" && auth.role !== "MEMBER") {
      return NextResponse.json(
        { error: "Workspace membership required to initiate email sending." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({ confirmed: true }));

    // Explicit confirmation guard
    if (body.confirmed === false) {
      return NextResponse.json(
        { error: "Campaign sending was cancelled." },
        { status: 400 }
      );
    }

    const updated = await campaignService.startSending(id, auth.workspace.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Campaign queued for sending. Real-time background batches initiated.",
    });
  } catch (err: any) {
    console.error("Campaign Send Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to dispatch campaign" },
      { status: 500 }
    );
  }
}
