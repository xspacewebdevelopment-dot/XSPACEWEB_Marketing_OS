import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { smsCampaignService } from "@/lib/services/sms-campaigns";

const saveBroadcastSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Broadcast name is required").max(120),
  protocol: z.enum(["SMS", "RCS"]).default("SMS"),
  status: z.enum(["DRAFT", "SCHEDULED", "SENT", "ARCHIVED"]).default("DRAFT"),
  senderId: z.string().min(1, "Sender ID is required").max(20).default("NEXAREACH"),
  messageText: z.string().min(1, "Message text is required"),
  rcsCardTitle: z.string().max(120).optional().nullable(),
  rcsActionLabel: z.string().max(60).optional().nullable(),
  rcsActionUrl: z.string().max(500).optional().nullable(),
  rcsMediaUrl: z.string().max(500).optional().nullable(),
  rcsSuggestion: z.string().max(100).optional().nullable(),
  audienceType: z.enum(["ALL", "LIST", "TEST"]).default("ALL"),
  listId: z.string().optional().nullable(),
  testPhone: z.string().max(30).optional().nullable(),
  audienceConfig: z.any().optional().nullable(),
  encoding: z.enum(["GSM-7", "UCS-2"]).default("GSM-7"),
  characterCount: z.number().int().min(0).default(0),
  segments: z.number().int().min(1).default(1),
  totalRecipients: z.number().int().min(0).default(0),
  totalSegments: z.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const protocol = searchParams.get("protocol") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "20", 10) || 20;

    const data = await smsCampaignService.listBroadcasts(auth.workspace.id, {
      status,
      protocol,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve SMS broadcasts" },
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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = saveBroadcastSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    // Calculate server-side audience estimates for eligible recipients only (Requirement 6 & 7)
    const audienceEligibility = await smsCampaignService.calculateAudienceEligibility(
      auth.workspace.id,
      {
        audienceType: parsed.data.audienceType,
        listId: parsed.data.listId,
        testPhone: parsed.data.testPhone,
        messageText: parsed.data.messageText,
        encodingPreference: parsed.data.encoding === "UCS-2" ? "UCS-2" : "AUTO",
      }
    ).catch(() => null);

    const calculatedRecipients = audienceEligibility
      ? (audienceEligibility.totalSelected === 0 && (parsed.data.totalRecipients || 0) > 0
          ? parsed.data.totalRecipients!
          : audienceEligibility.eligibleCount)
      : (parsed.data.totalRecipients || 0);

    const calculatedSegments = audienceEligibility
      ? (audienceEligibility.totalSelected === 0 && (parsed.data.totalSegments || 0) > 0
          ? parsed.data.totalSegments!
          : audienceEligibility.estimates.estimatedTotalSegments)
      : (parsed.data.totalSegments || 0);

    const broadcastPayload = {
      ...parsed.data,
      totalRecipients: calculatedRecipients,
      totalSegments: calculatedSegments,
      audienceConfig: audienceEligibility ? {
        totalSelected: audienceEligibility.totalSelected,
        eligibleCount: audienceEligibility.eligibleCount,
        excludedCount: audienceEligibility.excludedCount,
        exclusionBreakdown: audienceEligibility.exclusionBreakdown,
        isEstimate: true,
      } : parsed.data.audienceConfig,
    };

    // Never trust workspaceId from client; strictly enforce auth.workspace.id
    if (parsed.data.id) {
      // Update existing draft if ID is supplied
      const updated = await smsCampaignService.updateBroadcast(
        parsed.data.id,
        auth.workspace.id,
        broadcastPayload
      );
      return NextResponse.json({ success: true, broadcast: updated }, { status: 200 });
    } else {
      // Create new draft
      const created = await smsCampaignService.createBroadcast(
        auth.workspace.id,
        auth.user.id,
        broadcastPayload
      );
      return NextResponse.json({ success: true, broadcast: created }, { status: 201 });
    }
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error.message?.includes("Only draft")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save SMS broadcast draft" },
      { status: 500 }
    );
  }
}
