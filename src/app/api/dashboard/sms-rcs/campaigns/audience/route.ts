import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { smsCampaignService } from "@/lib/services/sms-campaigns";

const calculateAudienceSchema = z.object({
  audienceType: z.enum(["ALL", "LIST", "TEST"]).default("ALL"),
  listId: z.string().optional().nullable(),
  testPhone: z.string().max(40).optional().nullable(),
  messageText: z.string().optional().default(""),
  encodingPreference: z.enum(["AUTO", "GSM-7", "UCS-2"]).optional().default("AUTO"),
});

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const parsed = calculateAudienceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    // Always enforce auth.workspace.id server-side (Requirement 6)
    const result = await smsCampaignService.calculateAudienceEligibility(
      auth.workspace.id,
      parsed.data
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.message?.includes("not found") || error.message?.includes("access denied")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate audience eligibility" },
      { status: 500 }
    );
  }
}
