import { inngest } from "./client";
import { verificationService } from "@/lib/services/verification";
import { campaignService } from "@/lib/services/campaigns";
import { prisma } from "@/lib/prisma";

/**
 * Diagnostic background function to verify Inngest connectivity and worker execution.
 * Completely safe and harmless: does not trigger any emails, jobs, or credit consumption.
 */
export const diagnosticPingFunction = inngest.createFunction(
  {
    id: "nexareach-diagnostic-ping",
    name: "NexaReach Diagnostic Ping",
    triggers: [{ event: "nexareach/diagnostic.ping" }],
  },
  async ({ event, step }) => {
    const timestamp = await step.run("record-timestamp", async () => {
      return new Date().toISOString();
    });

    const diagnostics = await step.run("collect-diagnostics", async () => {
      return {
        status: "HEALTHY",
        engine: "Inngest v4",
        environment: process.env.NODE_ENV || "development",
        timestamp,
        receivedEvent: event.name,
        payloadEcho: event.data,
      };
    });

    return {
      success: true,
      message: "NexaReach Inngest diagnostic function executed successfully.",
      diagnostics,
    };
  }
);

/**
 * Production Inngest durable function for bulk email verification.
 * Step-based polling and persistence against Reoon API.
 */
export const processBulkVerificationFunction = inngest.createFunction(
  {
    id: "nexareach-process-bulk-verification",
    name: "NexaReach Process Bulk Verification",
    triggers: [{ event: "nexareach/bulk.verify.process" }],
    concurrency: {
      limit: 3,
    },
    retries: 2,
  },
  async ({ event, step }) => {
    const { jobId, workspaceId } = event.data as {
      jobId: string;
      workspaceId: string;
    };

    let isFinished = false;
    let attempts = 0;
    const maxAttempts = 60; // 60 iterations * 5s = 5 minutes of durable stepping

    while (!isFinished && attempts < maxAttempts) {
      attempts++;

      await step.sleep(`poll-wait-${attempts}`, "5s");

      const pollResult = await step.run(`poll-status-${attempts}`, async () => {
        const job = await verificationService.pollJobStatus(jobId, workspaceId);
        return {
          status: job.status,
          processedRecords: job.processedRecords,
          progressPercentage: job.progressPercentage,
        };
      });

      if (
        pollResult.status === "COMPLETED" ||
        pollResult.status === "FAILED" ||
        pollResult.status === "CANCELLED"
      ) {
        isFinished = true;
        return {
          success: pollResult.status === "COMPLETED",
          finalStatus: pollResult.status,
          jobId,
        };
      }
    }

    return {
      success: true,
      message: "Bulk polling cycle completed (or awaiting subsequent refresh)",
      jobId,
    };
  }
);

/**
 * Production Inngest durable function for sending email campaigns in safe batches.
 * Enforces per-batch suppression rechecks, rate limits, and pause/resume capability.
 */
export const sendCampaignFunction = inngest.createFunction(
  {
    id: "nexareach-send-campaign",
    name: "NexaReach Send Email Campaign",
    triggers: [{ event: "nexareach/campaign.send" }],
    concurrency: {
      limit: 2,
    },
    retries: 2,
  },
  async ({ event, step }) => {
    const { campaignId, workspaceId } = event.data as {
      campaignId: string;
      workspaceId: string;
    };

    let hasMore = true;
    let batchIndex = 0;
    const maxBatches = 500; // Safeguard limit per run

    while (hasMore && batchIndex < maxBatches) {
      batchIndex++;

      // Check current campaign status before batch run
      const campaignStatus = await step.run(
        `check-status-${batchIndex}`,
        async () => {
          const camp = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { status: true, batchSize: true, batchDelayMs: true },
          });
          return camp;
        }
      );

      if (!campaignStatus || campaignStatus.status !== "SENDING") {
        return {
          success: false,
          reason: `Campaign sending halted due to status: ${campaignStatus?.status || "NOT_FOUND"}`,
          campaignId,
        };
      }

      const batchResult = await step.run(`send-batch-${batchIndex}`, async () => {
        return campaignService.processBatch(
          campaignId,
          campaignStatus.batchSize || 50
        );
      });

      hasMore = batchResult.hasMore;

      if (hasMore) {
        const delayMs = Math.min(Math.max(campaignStatus.batchDelayMs || 1000, 500), 10000);
        await step.sleep(`throttle-delay-${batchIndex}`, `${Math.round(delayMs / 1000)}s`);
      }
    }

    return {
      success: true,
      campaignId,
      workspaceId,
      batchesProcessed: batchIndex,
    };
  }
);

/**
 * Production Inngest durable function for scheduling campaigns with timezone awareness.
 */
export const scheduleCampaignFunction = inngest.createFunction(
  {
    id: "nexareach-schedule-campaign",
    name: "NexaReach Schedule Email Campaign",
    triggers: [{ event: "nexareach/campaign.schedule" }],
  },
  async ({ event, step }) => {
    const { campaignId, workspaceId, scheduledAtUtc } = event.data as {
      campaignId: string;
      workspaceId: string;
      scheduledAtUtc: string;
    };

    // Durable sleep until exact scheduled timestamp
    await step.sleepUntil("wait-for-schedule", scheduledAtUtc);

    // Verify campaign is still in SCHEDULED status
    const canSend = await step.run("verify-scheduled-state", async () => {
      const camp = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true },
      });
      if (camp?.status === "SCHEDULED") {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: "SENDING", startedAt: new Date() },
        });
        return true;
      }
      return false;
    });

    if (canSend) {
      await inngest.send({
        name: "nexareach/campaign.send",
        data: { campaignId, workspaceId },
      });
    }

    return {
      scheduled: true,
      dispatched: canSend,
      campaignId,
    };
  }
);

export const inngestFunctions = [
  diagnosticPingFunction,
  processBulkVerificationFunction,
  sendCampaignFunction,
  scheduleCampaignFunction,
];

