import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { listsSegmentsService } from "@/lib/services/lists-segments";

const previewSchema = z.object({
  conditions: z.object({
    matchType: z.enum(["AND", "OR"]),
    conditions: z.array(
      z.object({
        field: z.string(),
        operator: z.string(),
        value: z.any().optional(),
      })
    ),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const result = await listsSegmentsService.previewSegmentMatches(
      auth.workspace.id,
      parsed.data.conditions as any
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate segment" },
      { status: 500 }
    );
  }
}
