import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { deliverabilityService } from "@/lib/services/deliverability";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (auth.role !== "OWNER" && auth.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only workspace owners and administrators can delete domains." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await deliverabilityService.deleteDomain(auth.workspace.id, id);

    return NextResponse.json({ success: true, message: "Domain deleted successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete domain";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as { isDefault?: boolean };

    if (body.isDefault) {
      await deliverabilityService.setDefaultDomain(auth.workspace.id, id);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update domain";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
