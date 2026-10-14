import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { deliverabilityService } from "@/lib/services/deliverability";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await deliverabilityService.verifyDomain(auth.workspace.id, id);

    return NextResponse.json({
      success: true,
      data: result.domain,
      dnsResult: result.dnsResult,
      dmarcAnalysis: result.dmarcAnalysis,
      resendVerified: result.resendVerified,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify domain";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
