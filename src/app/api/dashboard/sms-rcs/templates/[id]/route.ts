import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { smsTemplateService } from "@/lib/services/sms-templates";

const updateSmsTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100).optional(),
  description: z.string().max(255).optional().nullable(),
  protocol: z.enum(["SMS", "RCS"]).optional(),
  category: z
    .enum(["TRANSACTIONAL", "PROMOTIONAL", "ALERTS", "MARKETING", "GENERAL"])
    .optional(),
  messageText: z.string().min(1, "Message text is required").max(1600).optional(),
  rcsCardTitle: z.string().max(120).optional().nullable(),
  rcsMediaUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? val.trim() : null)),
  rcsActionLabel: z.string().max(60).optional().nullable(),
  rcsActionUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? val.trim() : null)),
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
    const template = await smsTemplateService.getTemplateById(id, auth.workspace.id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch template" },
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
    const parsed = updateSmsTemplateSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await smsTemplateService.updateTemplate(
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
      { success: false, error: error.message || "Failed to update template" },
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
    const result = await smsTemplateService.deleteTemplate(id, auth.workspace.id);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete template" },
      { status: 500 }
    );
  }
}
