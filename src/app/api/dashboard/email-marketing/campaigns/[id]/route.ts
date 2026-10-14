import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { campaignService } from "@/lib/services/campaigns";
import { updateCampaignSchema } from "@/lib/types/campaigns";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const campaign = await campaignService.getCampaignById(id, auth.workspace.id);

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (err: any) {
    console.error("Campaign GET Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve campaign" },
      { status: err.message === "Campaign not found" ? 404 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validated = updateCampaignSchema.parse(body);

    const updated = await campaignService.updateCampaign(
      id,
      auth.workspace.id,
      validated
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Campaign updated successfully",
    });
  } catch (err: any) {
    console.error("Campaign PUT Error:", err);
    if (err instanceof z.ZodError) {
      const issue = (err as any).issues?.[0] || (err as any).errors?.[0];
      return NextResponse.json(
        { error: issue?.message || "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await campaignService.deleteCampaign(id, auth.workspace.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Campaign deleted successfully",
    });
  } catch (err: any) {
    console.error("Campaign DELETE Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
