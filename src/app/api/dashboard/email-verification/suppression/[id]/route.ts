import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { suppressionService } from "@/lib/services/suppression";

const removeSchema = z.object({
  justification: z
    .string()
    .min(5, "A removal justification of at least 5 characters is required"),
  confirmedRenewedConsent: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;

    const entry = await prisma.suppressionEntry.findFirst({
      where: { id, workspaceId: auth.workspace.id },
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: "Suppression entry not found" },
        { status: 404 }
      );
    }

    const auditHistory = await suppressionService.getSuppressionAuditHistory(
      auth.workspace.id,
      entry.normalizedEmail
    );

    return NextResponse.json({ success: true, entry, auditHistory });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve suppression details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await suppressionService.removeSuppression(auth.workspace.id, id, {
      removedByUserId: auth.user.id,
      removedByUserEmail: auth.user.email,
      justification: parsed.data.justification,
      confirmedRenewedConsent: parsed.data.confirmedRenewedConsent,
      userRole: auth.role || "MEMBER",
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove suppression entry" },
      { status: 400 }
    );
  }
}
