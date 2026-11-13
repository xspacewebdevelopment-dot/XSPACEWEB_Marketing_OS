import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { smsCampaignService } from "@/lib/services/sms-campaigns";

const updateBroadcastSchema = z.object({
  name: z.string().min(1, "Broadcast name is required").max(120).optional(),
  protocol: z.enum(["SMS", "RCS"]).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "SENT", "ARCHIVED"]).optional(),
  senderId: z.string().min(1).max(20).optional(),
  messageText: z.string().min(1, "Message text is required").optional(),
  rcsCardTitle: z.string().max(120).optional().nullable(),
  rcsActionLabel: z.string().max(60).optional().nullable(),
  rcsActionUrl: z.string().max(500).optional().nullable(),
  rcsMediaUrl: z.string().max(500).optional().nullable(),
  rcsSuggestion: z.string().max(100).optional().nullable(),
  audienceType: z.enum(["ALL", "LIST", "TEST"]).optional(),
  listId: z.string().optional().nullable(),
  testPhone: z.string().max(30).optional().nullable(),
  audienceConfig: z.any().optional().nullable(),
  encoding: z.enum(["GSM-7", "UCS-2"]).optional(),
  characterCount: z.number().int().min(0).optional(),
  segments: z.number().int().min(1).optional(),
  totalRecipients: z.number().int().min(0).optional(),
  totalSegments: z.number().int().min(0).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const broadcast = await smsCampaignService.getBroadcastById(id, auth.workspace.id);

    if (!broadcast) {
      return NextResponse.json(
        { success: false, error: "Broadcast draft not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, broadcast });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch broadcast" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const body = await req.json();
    const parsed = updateBroadcastSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await smsCampaignService.updateBroadcast(
      id,
      auth.workspace.id,
      parsed.data
    );

    return NextResponse.json({ success: true, broadcast: updated });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error.message?.includes("Only draft")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update broadcast draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const result = await smsCampaignService.deleteBroadcast(id, auth.workspace.id);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    if (error.message?.includes("Only draft")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete broadcast draft" },
      { status: 500 }
    );
  }
}
