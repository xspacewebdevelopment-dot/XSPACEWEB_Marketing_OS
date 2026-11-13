import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { voiceCampaignService } from "@/lib/services/voice-campaigns";

const saveCampaignSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Campaign name is required").max(120),
  description: z.string().max(500).optional().nullable(),
  purpose: z.string().default("NOTIFICATION"),
  status: z.enum(["DRAFT", "READY_FOR_REVIEW", "SCHEDULED", "QUEUED", "COMPLETED", "CANCELLED", "FAILED"]).default("DRAFT"),
  scriptText: z.string().min(1, "Voice script text is required"),
  language: z.string().default("en-US"),
  voiceId: z.string().default("alloy"),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().min(0.5).max(2.0).default(1.0),
  audienceType: z.enum(["ALL", "LIST", "SEGMENT", "TEST"]).default("ALL"),
  listId: z.string().optional().nullable(),
  segmentId: z.string().optional().nullable(),
  testPhone: z.string().max(50).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  timezone: z.string().default("UTC").optional().nullable(),
  templateId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "20", 10) || 20;

    const data = await voiceCampaignService.listCampaigns(auth.workspace.id, {
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve voice campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = saveCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    // Calculate server-side audience eligibility
    const audienceEligibility = await voiceCampaignService.calculateAudienceEligibility(
      auth.workspace.id,
      {
        audienceType: parsed.data.audienceType,
        listId: parsed.data.listId,
        segmentId: parsed.data.segmentId,
        testPhone: parsed.data.testPhone,
        scriptText: parsed.data.scriptText,
      }
    ).catch(() => null);

    const payload = {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      totalRecipients: audienceEligibility ? audienceEligibility.totalSelected : 0,
      eligibleCount: audienceEligibility ? audienceEligibility.eligibleCount : 0,
      excludedCount: audienceEligibility ? audienceEligibility.excludedCount : 0,
      audienceConfig: audienceEligibility ? {
        totalSelected: audienceEligibility.totalSelected,
        eligibleCount: audienceEligibility.eligibleCount,
        excludedCount: audienceEligibility.excludedCount,
        exclusionBreakdown: audienceEligibility.exclusionBreakdown,
        isEstimate: true,
      } : null,
    };

    if (parsed.data.id) {
      const updated = await voiceCampaignService.updateCampaign(
        parsed.data.id,
        auth.workspace.id,
        payload
      );
      return NextResponse.json({ success: true, campaign: updated }, { status: 200 });
    } else {
      const created = await voiceCampaignService.createCampaign(
        auth.workspace.id,
        auth.user.id,
        payload
      );
      return NextResponse.json({ success: true, campaign: created }, { status: 201 });
    }
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error.message?.includes("Only draft")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save voice campaign" },
      { status: 500 }
    );
  }
}
