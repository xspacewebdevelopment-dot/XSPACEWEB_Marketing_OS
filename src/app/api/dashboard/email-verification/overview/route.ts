import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reoonClient } from "@/lib/reoon/client";


export async function GET() {
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

    // Real database queries - will return 0 for new workspaces (no fake numbers)
    const [
      totalVerified,
      validCount,
      invalidCount,
      riskyCount,
      unknownCount,
      recentJobsCount,
    ] = await Promise.all([
      prisma.verificationResult.count({ where: { workspaceId } }),
      prisma.verificationResult.count({ where: { workspaceId, status: "VALID" } }),
      prisma.verificationResult.count({ where: { workspaceId, status: "INVALID" } }),
      prisma.verificationResult.count({ where: { workspaceId, status: "RISKY" } }),
      prisma.verificationResult.count({ where: { workspaceId, status: "UNKNOWN" } }),
      prisma.verificationJob.count({ where: { workspaceId } }),
    ]);

    const validityRate =
      totalVerified > 0 ? Number(((validCount / totalVerified) * 100).toFixed(1)) : 0;

    // Fetch activity data (grouped by date) - will be empty array if no records
    const recentResults = await prisma.verificationResult.findMany({
      where: { workspaceId },
      orderBy: { verifiedAt: "desc" },
      take: 100,
      select: {
        verifiedAt: true,
        status: true,
      },
    });

    const providerConfig = reoonClient.getConfigStatus();
    const balanceInfo = await reoonClient.getAccountBalance();

    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
        },
        kpis: {
          totalVerified,
          validCount,
          invalidCount,
          riskyCount,
          unknownCount,
          validityRate,
          recentJobsCount,
        },
        activity: recentResults,
        provider: {
          ...providerConfig,
          creditStatus: balanceInfo.status,
          credits: balanceInfo.credits,
          isMock: balanceInfo.isMock,
        },
      },
    });
  } catch (error) {
    console.error("Error in overview endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load verification overview" },
      { status: 500 }
    );
  }
}
