import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "RISKY"; // ALL, RISKY, INVALID, UNKNOWN, SUPPRESSED
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "25", 10)));
    const search = searchParams.get("search")?.toLowerCase().trim();

    const workspaceId = auth.workspace.id;

    // Build query conditions for verification results
    const where: Prisma.VerificationResultWhereInput = { workspaceId };

    if (search) {
      where.normalizedEmail = { contains: search };
    }

    if (filter === "INVALID") {
      where.status = "INVALID";
    } else if (filter === "UNKNOWN") {
      where.status = "UNKNOWN";
    } else if (filter === "RISKY") {
      where.OR = [
        { status: "RISKY" },
        { isCatchAll: true },
        { isDisposable: true },
      ];
    } else if (filter === "VALID") {
      where.status = "VALID";
    }

    // If filter is SUPPRESSED, query suppression list directly
    if (filter === "SUPPRESSED") {
      const suppressionWhere: Prisma.SuppressionEntryWhereInput = { workspaceId, status: "ACTIVE" };
      if (search) {
        suppressionWhere.normalizedEmail = { contains: search };
      }

      const [total, items] = await Promise.all([
        prisma.suppressionEntry.count({ where: suppressionWhere }),
        prisma.suppressionEntry.findMany({
          where: suppressionWhere,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            email: true,
            normalizedEmail: true,
            reason: true,
            source: true,
            createdAt: true,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: items.map((i) => ({
          id: i.id,
          email: i.email || i.normalizedEmail,
          normalizedEmail: i.normalizedEmail,
          status: "SUPPRESSED",
          reason: i.reason,
          source: i.source,
          verifiedAt: i.createdAt,
          isSuppressed: true,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const [total, items, activeSuppressions] = await Promise.all([
      prisma.verificationResult.count({ where }),
      prisma.verificationResult.findMany({
        where,
        orderBy: { verifiedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          normalizedEmail: true,
          status: true,
          providerStatus: true,
          providerSubstatus: true,
          reason: true,
          isCatchAll: true,
          isDisposable: true,
          isRoleBased: true,
          verifiedAt: true,
          contact: {
            select: {
              firstName: true,
              lastName: true,
              company: true,
            },
          },
        },
      }),
      prisma.suppressionEntry.findMany({
        where: { workspaceId, status: "ACTIVE" },
        select: { normalizedEmail: true },
      }),
    ]);

    const suppressedSet = new Set(activeSuppressions.map((s) => s.normalizedEmail));

    const formatted = items.map((item) => ({
      ...item,
      isSuppressed: suppressedSet.has(item.normalizedEmail),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load list health data";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
