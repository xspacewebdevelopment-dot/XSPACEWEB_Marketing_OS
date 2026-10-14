import { inngest } from "./client";
import { verificationService } from "@/lib/services/verification";

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

export const inngestFunctions = [
  diagnosticPingFunction,
  processBulkVerificationFunction,
];

