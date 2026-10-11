import { inngest } from "./client";

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

export const inngestFunctions = [diagnosticPingFunction];
