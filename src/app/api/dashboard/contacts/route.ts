import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { contactsService } from "@/lib/services/contacts";
import type { ContactQueryOptions } from "@/lib/types/contacts";

const createContactSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  verificationStatus: z.enum(["UNVERIFIED", "VALID", "INVALID", "RISKY", "UNKNOWN"]).optional(),
  subscriptionStatus: z.enum(["PENDING", "SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED"]).optional(),
  listIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "25", 10) || 25;
    const search = searchParams.get("search") || undefined;
    const verificationStatus = (searchParams.get("verificationStatus") as any) || undefined;
    const suppressionStatus = (searchParams.get("suppressionStatus") as any) || undefined;
    const subscriptionStatus = (searchParams.get("subscriptionStatus") as any) || undefined;
    const listId = searchParams.get("listId") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

    const options: ContactQueryOptions = {
      page,
      limit,
      search,
      verificationStatus,
      suppressionStatus,
      subscriptionStatus,
      listId,
      tag,
      sortBy,
      sortOrder,
    };

    const data = await contactsService.getContacts(auth.workspace.id, options);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve contacts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const contact = await contactsService.createContact(auth.workspace.id, parsed.data);
    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("already exists in this workspace")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create contact" },
      { status: 400 }
    );
  }
}
