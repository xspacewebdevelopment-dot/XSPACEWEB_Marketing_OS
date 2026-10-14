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

    // Real database queries and balance check executed in parallel
    const [
      totalVerified,
      validCount,
      invalidCount,
      riskyCount,
      unknownCount,
      recentJobsCount,
      singleCount,
      recentResults,
      balanceInfo,
    ] = await Promise.all([
      prisma.verificationResult.count({ where: { workspaceId } }),
      prisma.verificationResult.count({ where: { workspaceId, status: "VALID" } }),
      prisma.verificationResult.count({ where: { workspaceId, status: "INVALID" } }),
      prisma.verificationResult.count({ where: { workspaceId, status: "RISKY" } }),
      prisma.verificationResult.count({ where: { workspaceId, status: "UNKNOWN" } }),
      prisma.verificationJob.count({ where: { workspaceId } }),
      prisma.verificationResult.count({ where: { workspaceId, source: "SINGLE" } }),
      prisma.verificationResult.findMany({
        where: { workspaceId },
        orderBy: { verifiedAt: "desc" },
        take: 100,
        select: {
          verifiedAt: true,
          status: true,
          verificationMode: true,
          source: true,
        },
      }),
      reoonClient.getAccountBalance().catch(() => ({
        dailyCreditsRemaining: null,
        instantCreditsRemaining: null,
        totalCreditsRemaining: null,
        status: "active",
        message: "Cached balance mode",
        lastRefreshedAt: new Date().toISOString(),
        hasApiKey: true,
      })),
    ]);

    const validityRate =
      totalVerified > 0 ? Number(((validCount / totalVerified) * 100).toFixed(1)) : 0;

    const providerConfig = reoonClient.getConfigStatus();

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
          singleCount,
        },
        activity: recentResults,
        provider: {
          ...providerConfig,
          creditStatus: balanceInfo.status,
          credits: balanceInfo.totalCreditsRemaining,
          dailyCredits: balanceInfo.dailyCreditsRemaining,
          instantCredits: balanceInfo.instantCreditsRemaining,
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
