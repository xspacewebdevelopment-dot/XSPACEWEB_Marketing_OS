import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { listsSegmentsService } from "@/lib/services/lists-segments";

const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const list = await listsSegmentsService.getListById(auth.workspace.id, id);
    return NextResponse.json({ success: true, list });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "List not found" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const parsed = updateListSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await listsSegmentsService.updateList(auth.workspace.id, id, parsed.data);
    return NextResponse.json({ success: true, list: updated });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update list" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const { id } = await params;
    const res = await listsSegmentsService.deleteList(auth.workspace.id, id);
    return NextResponse.json(res);
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete list" },
      { status: 400 }
    );
  }
}
