import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { voiceTemplatesService } from "@/lib/services/voice-templates";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(120),
  description: z.string().max(500).optional().nullable(),
  category: z.string().default("GENERAL"),
  scriptText: z.string().min(1, "Voice script is required"),
  language: z.string().default("en-US"),
  voiceId: z.string().default("alloy"),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  tags: z.array(z.string()).default([]),
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
    const category = searchParams.get("category") || undefined;
    const language = searchParams.get("language") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "20", 10) || 20;

    const data = await voiceTemplatesService.listTemplates(auth.workspace.id, {
      category,
      language,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load voice templates" },
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
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const template = await voiceTemplatesService.createTemplate(
      auth.workspace.id,
      auth.user.id,
      parsed.data
    );

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create voice template" },
      { status: 500 }
    );
  }
}
