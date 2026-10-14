import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { suppressionService } from "@/lib/services/suppression";
import type { SuppressionQueryOptions, SuppressionReason, SuppressionSource, SuppressionStatus } from "@/lib/types/suppression";

const addSuppressionSchema = z.object({
  email: z.string().email("Invalid email address format").optional(),
  emails: z.array(z.string().email("Invalid email address format")).optional(),
  reason: z.enum([
    "MANUAL_BLOCK",
    "DO_NOT_CONTACT",
    "UNSUBSCRIBED",
    "HARD_BOUNCE",
    "SPAM_COMPLAINT",
    "SYSTEM_EXCLUSION",
  ]).default("MANUAL_BLOCK"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
}).refine((data) => data.email || (data.emails && data.emails.length > 0), {
  message: "Either email or emails array is required",
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "20", 10) || 20;
    const search = searchParams.get("search") || undefined;
    const reason = (searchParams.get("reason") as SuppressionReason | "ALL") || undefined;
    const source = (searchParams.get("source") as SuppressionSource | "ALL") || undefined;
    const status = (searchParams.get("status") as SuppressionStatus | "ALL") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

    const options: SuppressionQueryOptions = {
      page,
      limit,
      search,
      reason,
      source,
      status,
      sortBy,
      sortOrder,
    };

    const data = await suppressionService.getSuppressions(auth.workspace.id, options);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve suppressions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    const body = await req.json();

    const parsed = addSuppressionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { email, emails, reason, notes } = parsed.data;

    if (emails && emails.length > 0) {
      const results = [];
      for (const e of emails) {
        try {
          const entry = await suppressionService.addSuppression(auth.workspace.id, {
            email: e,
            reason: reason as SuppressionReason,
            notes,
            source: "MANUAL",
            addedByUserId: auth.user.id,
            addedByUserEmail: auth.user.email,
          });
          results.push(entry);
        } catch {
          // ignore duplicate errors during batch
        }
      }
      return NextResponse.json({ success: true, count: results.length, entries: results }, { status: 201 });
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const entry = await suppressionService.addSuppression(auth.workspace.id, {
      email,
      reason: reason as SuppressionReason,
      notes,
      source: "MANUAL",
      addedByUserId: auth.user.id,
      addedByUserEmail: auth.user.email,
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("already actively suppressed")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add suppression entry" },
      { status: 400 }
    );
  }
}
