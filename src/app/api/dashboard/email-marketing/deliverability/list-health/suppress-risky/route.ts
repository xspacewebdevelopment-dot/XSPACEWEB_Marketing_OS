import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";

const suppressRiskySchema = z.object({
  emails: z.array(z.string().email()).min(1, "At least one email must be selected for suppression"),
  reason: z.enum(["INVALID", "RISKY", "DISPOSABLE", "MANUAL"]).default("INVALID"),
  confirmationText: z.string().min(1, "Explicit confirmation is required"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = suppressRiskySchema.parse(body);

    // Require explicit confirmation keyword "CONFIRM" or "SUPPRESS"
    if (
      validated.confirmationText.trim().toUpperCase() !== "CONFIRM" &&
      validated.confirmationText.trim().toUpperCase() !== "SUPPRESS"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Explicit confirmation required. Please enter 'CONFIRM' to suppress these addresses.",
        },
        { status: 400 }
      );
    }

    const workspaceId = auth.workspace.id;
    let addedCount = 0;
    let alreadySuppressedCount = 0;

    for (const rawEmail of validated.emails) {
      const normalized = normalizeEmail(rawEmail);

      const existing = await prisma.suppressionEntry.findUnique({
        where: {
          workspaceId_normalizedEmail: {
            workspaceId,
            normalizedEmail: normalized,
          },
        },
      });

      if (existing) {
        if (existing.status !== "ACTIVE") {
          // Reactivate suppression
          await prisma.suppressionEntry.update({
            where: { id: existing.id },
            data: {
              status: "ACTIVE",
              reason: validated.reason,
              notes: validated.notes || "Reactivated via Deliverability hygiene",
              removedAt: null,
            },
          });
          await prisma.suppressionAuditLog.create({
            data: {
              workspaceId,
              suppressionId: existing.id,
              email: rawEmail,
              normalizedEmail: normalized,
              action: "REACTIVATED",
              reason: validated.reason,
              performedByUserId: auth.user.id,
              performedByUserEmail: auth.user.email,
              justification: "Suppressed via Email Deliverability List Hygiene",
            },
          });
          addedCount++;
        } else {
          alreadySuppressedCount++;
        }
      } else {
        const created = await prisma.suppressionEntry.create({
          data: {
            workspaceId,
            email: rawEmail,
            normalizedEmail: normalized,
            reason: validated.reason,
            source: "MANUAL",
            notes: validated.notes || "Added via Deliverability List Health review",
            addedByUserId: auth.user.id,
            addedByUserEmail: auth.user.email,
          },
        });

        await prisma.suppressionAuditLog.create({
          data: {
            workspaceId,
            suppressionId: created.id,
            email: rawEmail,
            normalizedEmail: normalized,
            action: "ADDED",
            reason: validated.reason,
            performedByUserId: auth.user.id,
            performedByUserEmail: auth.user.email,
            justification: "Suppressed via Email Deliverability List Hygiene",
          },
        });
        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      addedCount,
      alreadySuppressedCount,
      message: `Successfully suppressed ${addedCount} contact(s). ${alreadySuppressedCount > 0 ? `(${alreadySuppressedCount} were already suppressed)` : ""}`,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issue = err.issues?.[0];
      return NextResponse.json(
        { success: false, error: issue?.message || "Invalid suppression payload" },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to suppress contacts";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
