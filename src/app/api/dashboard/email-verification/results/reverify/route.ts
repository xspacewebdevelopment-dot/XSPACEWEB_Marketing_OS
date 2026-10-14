import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reoonClient } from "@/lib/reoon/client";
import { verificationService, VerificationServiceError } from "@/lib/services/verification";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { resultIds, estimateOnly, confirmed, mode = "POWER" } = body;

    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one record to re-verify" },
        { status: 400 }
      );
    }

    // Fetch the emails belonging to this workspace
    const results = await prisma.verificationResult.findMany({
      where: {
        workspaceId: auth.workspace.id,
        id: { in: resultIds },
      },
      select: { email: true, normalizedEmail: true },
    });

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: "No matching verification records found in this workspace" },
        { status: 404 }
      );
    }

    // Deduplicate
    const uniqueEmails = Array.from(new Set(results.map((r) => r.email)));
    const estimatedCredits = uniqueEmails.length;

    // Check account balance
    const balance = await reoonClient.getAccountBalance().catch(() => ({
      totalCreditsRemaining: 1000,
      dailyCreditsRemaining: null,
      instantCreditsRemaining: null,
      status: "active",
      message: "Balance check",
      lastRefreshedAt: new Date().toISOString(),
      hasApiKey: true,
    }));

    if (estimateOnly) {
      return NextResponse.json({
        success: true,
        data: {
          totalEmails: uniqueEmails.length,
          estimatedCredits,
          availableCredits: balance.totalCreditsRemaining,
          hasSufficientCredits:
            balance.totalCreditsRemaining === null ||
            balance.totalCreditsRemaining >= estimatedCredits,
        },
      });
    }

    if (!confirmed) {
      return NextResponse.json(
        {
          success: false,
          error: "Explicit user confirmation is required to proceed with re-verification and credit consumption.",
          code: "CONFIRMATION_REQUIRED",
          data: {
            totalEmails: uniqueEmails.length,
            estimatedCredits,
            availableCredits: balance.totalCreditsRemaining,
          },
        },
        { status: 400 }
      );
    }

    if (
      balance.totalCreditsRemaining !== null &&
      balance.totalCreditsRemaining < estimatedCredits
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient Reoon credits. Required: ${estimatedCredits}, Available: ${balance.totalCreditsRemaining}.`,
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 }
      );
    }

    // Single re-verify
    if (uniqueEmails.length === 1) {
      const verified = await verificationService.verifySingle({
        workspaceId: auth.workspace.id,
        userId: auth.user.id,
        email: uniqueEmails[0],
        mode,
      });

      return NextResponse.json({
        success: true,
        type: "SINGLE",
        message: `Successfully re-verified ${uniqueEmails[0]} (${verified.status}).`,
        data: verified,
      });
    }

    // Bulk re-verify job
    const timestamp = new Date().toISOString().slice(0, 10);
    const job = await verificationService.createBulkJob({
      workspaceId: auth.workspace.id,
      userId: auth.user.id,
      filename: `reverification_batch_${timestamp}.csv`,
      sourceType: "REVERIFICATION",
      emails: uniqueEmails,
    });

    return NextResponse.json({
      success: true,
      type: "BULK",
      message: `Enqueued bulk re-verification job for ${uniqueEmails.length} emails.`,
      data: job,
    });
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

    const msg = err instanceof Error ? err.message : "Failed to execute re-verification";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
