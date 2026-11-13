import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { voiceCampaignService } from "@/lib/services/voice-campaigns";

const updateSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  purpose: z.string().optional(),
  status: z.enum(["DRAFT", "READY_FOR_REVIEW", "SCHEDULED", "QUEUED", "COMPLETED", "CANCELLED", "FAILED"]).optional(),
  scriptText: z.string().min(1, "Script text is required").optional(),
  language: z.string().optional(),
  voiceId: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  pitch: z.number().min(0.5).max(2.0).optional(),
  audienceType: z.enum(["ALL", "LIST", "SEGMENT", "TEST"]).optional(),
  listId: z.string().optional().nullable(),
  segmentId: z.string().optional().nullable(),
  testPhone: z.string().max(50).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  timezone: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const campaign = await voiceCampaignService.getCampaignById(id, auth.workspace.id);

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Voice campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve voice campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const payload: any = {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    };

    const updated = await voiceCampaignService.updateCampaign(id, auth.workspace.id, payload);
    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error.message?.includes("Only draft")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update voice campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await voiceCampaignService.deleteCampaign(id, auth.workspace.id);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error.message?.includes("Only draft")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete voice campaign" },
      { status: 500 }
    );
  }
}
