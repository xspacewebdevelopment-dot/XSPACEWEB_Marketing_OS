import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { suppressionService } from "@/lib/services/suppression";

const eligibilitySchema = z.object({
  emails: z
    .array(z.string())
    .min(1, "At least one recipient email address must be provided"),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const parsed = eligibilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const result = await suppressionService.checkRecipientEligibility(
      auth.workspace.id,
      parsed.data.emails
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check recipient eligibility" },
      { status: 500 }
    );
  }
}
