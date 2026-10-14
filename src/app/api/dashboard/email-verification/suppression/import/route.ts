import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { suppressionService } from "@/lib/services/suppression";

const bulkImportSchema = z.object({
  entries: z.array(
    z.object({
      email: z.string(),
      reason: z.string().optional(),
      notes: z.string().optional(),
    })
  ).min(1, "At least one email entry must be provided"),
  source: z.enum(["IMPORT", "MANUAL", "SYSTEM"]).default("IMPORT"),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const parsed = bulkImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const result = await suppressionService.bulkImportSuppressions(auth.workspace.id, {
      entries: parsed.data.entries,
      source: parsed.data.source as any,
      userId: auth.user.id,
      userEmail: auth.user.email,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process bulk import" },
      { status: 500 }
    );
  }
}
