import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


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
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);
    const limit = Math.min(Math.max(limitParam, 1), 50);

    const [jobs, totalCount] = await Promise.all([
      prisma.verificationJob.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.verificationJob.count({
        where: { workspaceId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        totalCount,
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
