import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificationService, VerificationServiceError } from "@/lib/services/verification";

const createBulkJobSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required").max(200),
  sourceType: z.enum(["CSV", "XLSX", "TXT", "MANUAL", "API", "IMPORT"]).default("CSV"),
  emails: z
    .array(z.string().trim())
    .min(1, "At least one email is required")
    .max(50000, "Maximum 50,000 emails per task"),
  duplicatesCount: z.number().int().nonnegative().optional().default(0),
  rejectedCount: z.number().int().nonnegative().optional().default(0),
  fileSize: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();

    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { workspace } = auth;
    const workspaceId = workspace.id;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 50);
    const skip = (page - 1) * limit;
    const status = searchParams.get("status")?.toUpperCase();

    const where: any = { workspaceId };
    if (status && ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    const [jobs, totalCount] = await Promise.all([
      prisma.verificationJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.verificationJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error in jobs endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load verification jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const parseResult = createBulkJobSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message || "Invalid bulk job parameters",
          code: "VALIDATION_ERROR",
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { filename, sourceType, emails, duplicatesCount, rejectedCount, fileSize } =
      parseResult.data;

    const job = await verificationService.createBulkJob({
      workspaceId: auth.workspace.id,
      userId: auth.user.id,
      filename,
      sourceType,
      emails,
      duplicatesCount,
      rejectedCount,
      fileSize,
    });

    const response = NextResponse.json({
      success: true,
      data: job,
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (err instanceof VerificationServiceError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: msg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
