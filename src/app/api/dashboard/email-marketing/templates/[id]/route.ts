import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeEmailHtml } from "@/lib/templates/compiler";
import { replaceBase64ImagesWithCloudinary, uploadBase64ToCloudinary } from "@/lib/cloudinary";

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(255).optional().nullable(),
  category: z.enum([
    "NEWSLETTER",
    "PROMOTIONAL",
    "PRODUCT",
    "EVENT",
    "WELCOME",
    "FOLLOWUP",
    "CUSTOM",
  ]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  subject: z.string().max(200).optional().nullable(),
  preheader: z.string().max(255).optional().nullable(),
  compiledHtml: z.string().optional().nullable(),
  editorJson: z.any().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  isStarred: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id,
        workspaceId: auth.workspace.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Email template not found in your workspace" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve template" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateTemplateSchema.parse(body);

    const existing = await prisma.emailTemplate.findFirst({
      where: {
        id,
        workspaceId: auth.workspace.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Email template not found in your workspace" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.subject !== undefined) updateData.subject = validated.subject;
    if (validated.preheader !== undefined) updateData.preheader = validated.preheader;
    if (validated.isStarred !== undefined) updateData.isStarred = validated.isStarred;
    if (validated.thumbnail !== undefined) {
      let thumb = validated.thumbnail;
      if (thumb && thumb.startsWith("data:image/")) {
        try {
          const up = await uploadBase64ToCloudinary(thumb, { folder: "nexareach/thumbnails" });
          thumb = up.secure_url;
        } catch (err) {
          console.error("Failed to upload thumbnail to Cloudinary:", err);
        }
      }
      updateData.thumbnail = thumb;
    }
    if (validated.editorJson !== undefined) updateData.editorJson = validated.editorJson;

    if (validated.compiledHtml !== undefined && validated.compiledHtml !== null) {
      let sanitized = sanitizeEmailHtml(validated.compiledHtml);
      if (sanitized.includes("data:image/")) {
        sanitized = await replaceBase64ImagesWithCloudinary(sanitized);
      }
      updateData.compiledHtml = sanitized;
    }

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Template updated successfully",
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const issue = (err as any).issues?.[0] || (err as any).errors?.[0];
      return NextResponse.json(
        { error: issue?.message || "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to update email template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.emailTemplate.findFirst({
      where: {
        id,
        workspaceId: auth.workspace.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Email template not found in your workspace" },
        { status: 404 }
      );
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Template "${existing.name}" deleted successfully`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete template" },
      { status: 500 }
    );
  }
}
