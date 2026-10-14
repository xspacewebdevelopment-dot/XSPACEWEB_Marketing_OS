import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const original = await prisma.emailTemplate.findFirst({
      where: {
        id,
        workspaceId: auth.workspace.id,
      },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const duplicate = await prisma.emailTemplate.create({
      data: {
        workspaceId: auth.workspace.id,
        userId: auth.user.id,
        name: `Copy of ${original.name}`,
        description: original.description,
        category: original.category,
        status: "DRAFT",
        subject: original.subject,
        preheader: original.preheader,
        compiledHtml: original.compiledHtml,
        editorJson: (original.editorJson ?? undefined) as any,
        thumbnail: original.thumbnail,
        tags: original.tags,
      },
    });

    return NextResponse.json({
      success: true,
      data: duplicate,
      message: `Template duplicated as "${duplicate.name}"`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
