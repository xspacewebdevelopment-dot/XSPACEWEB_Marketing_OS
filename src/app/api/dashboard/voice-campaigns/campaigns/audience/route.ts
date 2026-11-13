import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { voiceCampaignService } from "@/lib/services/voice-campaigns";

const audienceSchema = z.object({
  audienceType: z.enum(["ALL", "LIST", "SEGMENT", "TEST"]).default("ALL"),
  listId: z.string().optional().nullable(),
  segmentId: z.string().optional().nullable(),
  testPhone: z.string().max(50).optional().nullable(),
  scriptText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = audienceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const result = await voiceCampaignService.calculateAudienceEligibility(
      auth.workspace.id,
      parsed.data
    );

    return NextResponse.json({ success: true, audience: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate audience eligibility" },
      { status: 500 }
    );
  }
}
