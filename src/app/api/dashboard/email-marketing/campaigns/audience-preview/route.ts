import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { campaignService } from "@/lib/services/campaigns";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const audienceConfig = {
      contactIds: Array.isArray(body.contactIds) ? body.contactIds : [],
      listIds: Array.isArray(body.listIds) ? body.listIds : [],
      segmentIds: Array.isArray(body.segmentIds) ? body.segmentIds : [],
      excludedListIds: Array.isArray(body.excludedListIds) ? body.excludedListIds : [],
      excludedContactIds: Array.isArray(body.excludedContactIds) ? body.excludedContactIds : [],
    };

    const breakdown = await campaignService.calculateAudience(
      auth.workspace.id,
      audienceConfig
    );

    return NextResponse.json({
      success: true,
      data: breakdown,
    });
  } catch (err: any) {
    console.error("Audience Preview Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate audience breakdown" },
      { status: 500 }
    );
  }
}
