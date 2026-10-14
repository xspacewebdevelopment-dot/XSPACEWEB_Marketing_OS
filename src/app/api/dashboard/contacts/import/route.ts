import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { contactsService } from "@/lib/services/contacts";

const bulkImportSchema = z.object({
  contacts: z.array(
    z.object({
      email: z.string(),
      name: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      jobTitle: z.string().optional(),
      tags: z.array(z.string()).optional(),
      verificationStatus: z.enum(["UNVERIFIED", "VALID", "INVALID", "RISKY", "UNKNOWN"]).optional(),
      subscriptionStatus: z.enum(["PENDING", "SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED"]).optional(),
    })
  ).min(1, "At least one contact must be provided"),
  listIds: z.array(z.string()).optional(),
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

    const result = await contactsService.bulkImportContacts(auth.workspace.id, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import contacts" },
      { status: 500 }
    );
  }
}
