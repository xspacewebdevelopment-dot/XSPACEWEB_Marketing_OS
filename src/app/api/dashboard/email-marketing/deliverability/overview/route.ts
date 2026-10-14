import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { deliverabilityService } from "@/lib/services/deliverability";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { workspace } = auth;
    const data = await deliverabilityService.getDeliverabilityOverview(workspace.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load deliverability overview";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("Deliverability overview error:", err);
    return NextResponse.json(
      {
        success: false,
        error: message,
        stack,
      },
      { status: 500 }
    );
  }
}
