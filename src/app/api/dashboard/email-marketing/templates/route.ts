import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STARTER_TEMPLATES } from "@/lib/templates/starter-templates";
import { wrapInEmailContainer } from "@/lib/templates/compiler";
import { replaceBase64ImagesWithCloudinary, uploadBase64ToCloudinary } from "@/lib/cloudinary";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  description: z.string().max(255).optional().nullable(),
  category: z.enum([
    "NEWSLETTER",
    "PROMOTIONAL",
    "PRODUCT",
    "EVENT",
    "WELCOME",
    "FOLLOWUP",
    "CUSTOM",
  ]).default("CUSTOM"),
  starterId: z.string().optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  preheader: z.string().max(255).optional().nullable(),
  compiledHtml: z.string().optional().nullable(),
  editorJson: z.any().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "ALL";
    const sort = searchParams.get("sort") || "updatedAt"; // updatedAt, name, createdAt
    const status = searchParams.get("status") || "ALL";

    // Check if workspace has any templates; if not, seed the starter templates into database!
    const existingCount = await prisma.emailTemplate.count({
      where: { workspaceId: auth.workspace.id },
    });

    if (existingCount === 0) {
      // Seed the 7 curated starters into this workspace
      for (const starter of STARTER_TEMPLATES) {
        if (starter.id === "starter-blank") continue; // Keep blank for manual creation
        await prisma.emailTemplate.create({
          data: {
            workspaceId: auth.workspace.id,
            userId: auth.user.id,
            name: starter.name,
            description: starter.description,
            category: starter.category,
            status: "PUBLISHED",
            subject: starter.subject,
            preheader: starter.preheader,
            compiledHtml: wrapInEmailContainer(starter.compiledHtml, {
              title: starter.name,
              preheader: starter.preheader,
            }),
            editorJson: starter.editorJson,
            thumbnail: starter.thumbnailSvg,
          },
        });
      }
    }

    // Build filter query
    const where: any = {
      workspaceId: auth.workspace.id,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category !== "ALL") {
      where.category = category;
    }

    if (status !== "ALL") {
      where.status = status;
    }

    // Sort order
    let orderBy: any = { updatedAt: "desc" };
    if (sort === "name") {
      orderBy = { name: "asc" };
    } else if (sort === "createdAt") {
      orderBy = { createdAt: "desc" };
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        status: true,
        subject: true,
        preheader: true,
        thumbnail: true,
        tags: true,
        isStarred: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: templates,
      meta: {
        total: templates.length,
        startersCount: STARTER_TEMPLATES.length,
      },
    });
  } catch (err: any) {
    console.error("Templates GET Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTemplateSchema.parse(body);

    let html = validated.compiledHtml || "";
    let editorJson = validated.editorJson || null;
    let subject = validated.subject || "";
    let preheader = validated.preheader || "";
    let thumbnail: string | null = null;

    // If starterId is provided, pull starting content
    if (validated.starterId) {
      const starter = STARTER_TEMPLATES.find((s) => s.id === validated.starterId);
      if (starter) {
        html = wrapInEmailContainer(starter.compiledHtml, {
          title: validated.name,
          preheader: starter.preheader,
        });
        editorJson = starter.editorJson;
        subject = starter.subject;
        preheader = starter.preheader;
        thumbnail = starter.thumbnailSvg;
      }
    } else if (!html) {
      // Default blank canvas
      const blankStarter = STARTER_TEMPLATES.find((s) => s.id === "starter-blank");
      if (blankStarter) {
        html = wrapInEmailContainer(blankStarter.compiledHtml, {
          title: validated.name,
          preheader: "",
        });
        thumbnail = blankStarter.thumbnailSvg;
      }
    }

    // Ensure zero base64 images reach the database
    if (html && html.includes("data:image/")) {
      html = await replaceBase64ImagesWithCloudinary(html);
    }
    if (thumbnail && thumbnail.startsWith("data:image/")) {
      try {
        const up = await uploadBase64ToCloudinary(thumbnail, { folder: "nexareach/thumbnails" });
        thumbnail = up.secure_url;
      } catch (err) {
        console.error("Failed to upload thumbnail to Cloudinary:", err);
      }
    }

    const template = await prisma.emailTemplate.create({
      data: {
        workspaceId: auth.workspace.id,
        userId: auth.user.id,
        name: validated.name,
        description: validated.description || null,
        category: validated.category,
        status: "DRAFT",
        subject: subject || null,
        preheader: preheader || null,
        compiledHtml: html,
        editorJson: editorJson,
        thumbnail: thumbnail,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: template,
        message: "Email template created successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Templates POST Error:", err);
    if (err instanceof z.ZodError) {
      const issue = (err as any).issues?.[0] || (err as any).errors?.[0];
      return NextResponse.json(
        { error: issue?.message || "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to create email template" },
      { status: 500 }
    );
  }
}
