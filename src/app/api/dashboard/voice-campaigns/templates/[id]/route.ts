import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { voiceTemplatesService } from "@/lib/services/voice-templates";

const updateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.string().optional(),
  scriptText: z.string().min(1, "Voice script is required").optional(),
  language: z.string().optional(),
  voiceId: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).optional(),
  tags: z.array(z.string()).optional(),
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
    const template = await voiceTemplatesService.getTemplateById(id, auth.workspace.id);

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve template" },
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
    const parsed = updateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await voiceTemplatesService.updateTemplate(
      id,
      auth.workspace.id,
      parsed.data
    );

    return NextResponse.json({ success: true, template: updated });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update voice template" },
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
    const result = await voiceTemplatesService.deleteTemplate(id, auth.workspace.id);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete voice template" },
      { status: 500 }
    );
  }
}
