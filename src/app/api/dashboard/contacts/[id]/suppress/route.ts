import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { suppressionService } from "@/lib/services/suppression";

const suppressContactSchema = z.object({
  reason: z.enum([
    "MANUAL_BLOCK",
    "DO_NOT_CONTACT",
    "UNSUBSCRIBED",
    "HARD_BOUNCE",
    "SPAM_COMPLAINT",
    "SYSTEM_EXCLUSION",
  ]).default("MANUAL_BLOCK"),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const parsed = suppressContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findFirst({
      where: { id, workspaceId: auth.workspace.id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    const contactRecord = contact as typeof contact & {
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };

    const contactDisplayName =
      contactRecord.name ||
      [contactRecord.firstName, contactRecord.lastName].filter(Boolean).join(" ") ||
      contact.email;

    const suppression = await suppressionService.addSuppression(auth.workspace.id, {
      email: contact.email,
      reason: parsed.data.reason as any,
      notes: parsed.data.notes || `Suppressed from contact profile: ${contactDisplayName}`,
      source: "MANUAL",
      addedByUserId: auth.user.id,
      addedByUserEmail: auth.user.email,
    });

    return NextResponse.json({ success: true, suppression });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("already actively suppressed")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to suppress contact" },
      { status: 400 }
    );
  }
}
