import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { listsSegmentsService } from "@/lib/services/lists-segments";

const createListSchema = z.object({
  name: z.string().min(1, "List name is required").max(100),
  description: z.string().max(300).optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireAuth();
    const lists = await listsSegmentsService.getLists(auth.workspace.id);
    return NextResponse.json({ success: true, lists });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lists" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const parsed = createListSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const list = await listsSegmentsService.createList(auth.workspace.id, parsed.data);
    return NextResponse.json({ success: true, list }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create list" },
      { status: 400 }
    );
  }
}
