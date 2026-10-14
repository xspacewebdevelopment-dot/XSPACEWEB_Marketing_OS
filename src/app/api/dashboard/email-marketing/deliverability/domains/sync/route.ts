import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { deliverabilityService } from "@/lib/services/deliverability";

export async function POST() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (auth.role !== "OWNER" && auth.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only workspace owners and administrators can sync sending domains." },
        { status: 403 }
      );
    }

    const result = await deliverabilityService.syncResendDomains(auth.workspace.id);

    return NextResponse.json({
      success: true,
      syncedCount: result.syncedCount,
      domains: result.domains,
      message: `Synchronized ${result.syncedCount} domain(s) from connected Resend account.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sync domains from Resend";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
