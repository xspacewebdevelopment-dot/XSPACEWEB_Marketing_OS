import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { listsSegmentsService } from "@/lib/services/lists-segments";

const createSegmentSchema = z.object({
  name: z.string().min(1, "Segment name is required").max(100),
  description: z.string().max(300).optional(),
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

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireAuth();
    const segments = await listsSegmentsService.getSegments(auth.workspace.id);
    return NextResponse.json({ success: true, segments });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch segments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const parsed = createSegmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const segment = await listsSegmentsService.createSegment(auth.workspace.id, parsed.data as any);
    return NextResponse.json({ success: true, segment }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create segment" },
      { status: 400 }
    );
  }
}
