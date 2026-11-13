import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { smsTemplateService } from "@/lib/services/sms-templates";

const createSmsTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  description: z.string().max(255).optional().nullable(),
  protocol: z.enum(["SMS", "RCS"]).default("SMS"),
  category: z
    .enum(["TRANSACTIONAL", "PROMOTIONAL", "ALERTS", "MARKETING", "GENERAL"])
    .default("GENERAL"),
  messageText: z.string().min(1, "Message text is required").max(1600),
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
    const protocol = searchParams.get("protocol") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "12", 10) || 12;

    const data = await smsTemplateService.listTemplates(auth.workspace.id, {
      protocol,
      category,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve SMS/RCS templates" },
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
    const parsed = createSmsTemplateSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const created = await smsTemplateService.createTemplate(
      auth.workspace.id,
      auth.user.id,
      parsed.data
    );

    return NextResponse.json({ success: true, template: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create SMS/RCS template" },
      { status: 500 }
    );
  }
}
