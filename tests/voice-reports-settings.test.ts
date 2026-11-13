/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { voiceSettingsService } from "../src/lib/services/voice-settings";
import { voiceReportsService } from "../src/lib/services/voice-reports";
import { activeVoiceProvider } from "../src/lib/voice/provider-interface";

async function runVoiceReportsSettingsAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH VOICE REPORTS, SETTINGS & SAFETY AUDIT     ");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  // Setup isolated workspace
  const ws = await prisma.workspace.create({
    data: { name: `Voice Reports WS - ${Date.now()}` },
  });
  const wsId = ws.id;

  try {
    // ------------------------------------------------------------------------
    // 1. VOICE SETTINGS CRUD & CONSTRAINTS
    // ------------------------------------------------------------------------
    console.log("--- 1. Voice Settings Retrieval & Preference Configuration ---");

    const settings = await voiceSettingsService.getOrCreateSettings(wsId);
    assert(Boolean(settings.id), "Voice settings initialized with ID");
    assert(settings.defaultLanguage === "en-US", "Default language defaults to en-US");
    assert(settings.callingWindowStart === "09:00", "Default calling window start is 09:00");
    assert(settings.callingWindowEnd === "20:00", "Default calling window end is 20:00");
    assert(settings.quietHoursEnabled === true, "Quiet hours enabled by default");
    assert(settings.providerStatus === "NOT_CONNECTED", "Provider status defaults to NOT_CONNECTED");

    // Update settings
    const updatedSettings = await voiceSettingsService.updateSettings(wsId, {
      defaultLanguage: "en-GB",
      defaultVoice: "nova",
      callingWindowStart: "08:30",
      callingWindowEnd: "19:30",
      callingDays: "ALL_WEEK",
      maxRetryAttempts: 2,
      retryIntervalMinutes: 45,
    });

    assert(updatedSettings.defaultLanguage === "en-GB", "Updated language persisted (en-GB)");
    assert(updatedSettings.defaultVoice === "nova", "Updated voice timbre persisted (nova)");
    assert(updatedSettings.callingWindowStart === "08:30", "Updated window start persisted (08:30)");
    assert(updatedSettings.callingDays === "ALL_WEEK", "Updated calling days persisted");
    assert(updatedSettings.maxRetryAttempts === 2, "Updated retry attempts persisted (2)");

    // ------------------------------------------------------------------------
    // 2. REPORTS METRICS AGGREGATION & DRY-RUN SAFETY
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Reports Metrics Aggregation & Internal Simulation Flag ---");

    // Create fixture campaigns and call jobs
    const campaign = await (prisma as any).voiceCampaign.create({
      data: {
        workspaceId: wsId,
        name: "Test Audit Campaign",
        scriptText: "Test script text",
        status: "COMPLETED",
        eligibleCount: 5,
        excludedCount: 2,
        totalRecipients: 7,
      },
    });

    await (prisma as any).voiceCallJob.createMany({
      data: [
        {
          campaignId: campaign.id,
          workspaceId: wsId,
          destinationPhone: "+14155551234",
          destinationPhoneNorm: "+14155551234",
          renderedScript: "Test script",
          status: "COMPLETED",
          callDurationSeconds: 42,
          isSimulated: true,
        },
        {
          campaignId: campaign.id,
          workspaceId: wsId,
          destinationPhone: "+14155555678",
          destinationPhoneNorm: "+14155555678",
          renderedScript: "Test script",
          status: "FAILED",
          failureReason: "Recipient phone line busy",
          isSimulated: true,
        },
      ],
    });

    const reports = await voiceReportsService.getReportsData(wsId, "30d");
    assert(reports.isSimulated === true, "Reports data explicitly marked as isSimulated: true");
    assert(reports.providerStatus === "NOT_CONNECTED", "Provider status is NOT_CONNECTED");
    assert(reports.metrics.totalCampaigns >= 1, "Total campaigns count matches fixture");
    assert(reports.metrics.completedCalls >= 1, "Completed calls count reflects internal job records");
    assert(reports.metrics.failedCalls >= 1, "Failed calls count reflects internal job records");
    assert(reports.recentCampaigns.length >= 1, "Recent campaigns array populated");
    assert(reports.recentCallJobs.length >= 2, "Recent call jobs array populated");

    // ------------------------------------------------------------------------
    // 3. SECURE CSV EXPORT WITH FORMULA INJECTION SANITIZATION
    // ------------------------------------------------------------------------
    console.log("\n--- 3. CSV Export Generation & Formula Injection Protection ---");

    const csvOutput = await voiceReportsService.exportJobsCsv(wsId);
    assert(csvOutput.includes("Job ID,Campaign Name,Destination Phone"), "CSV header row is present");
    assert(csvOutput.includes("+14155551234"), "Destination phone number included in CSV");
    assert(csvOutput.includes("Internal Simulation"), "Execution mode labeled as Internal Simulation");

    // Test formula injection protection
    const sanitized = voiceReportsService.sanitizeSpreadsheetCell("=SUM(A1:A10)");
    assert(sanitized.startsWith("'="), "Formula injection character '=' prefixed with single quote");

    const sanitizedAt = voiceReportsService.sanitizeSpreadsheetCell("@INJECTION");
    assert(sanitizedAt.startsWith("'@"), "Formula injection character '@' prefixed with single quote");

    // ------------------------------------------------------------------------
    // 4. PROVIDER ABSTRACTION SAFETY (CALLING DISABLED)
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Telephony Provider Abstraction Safety Layer ---");

    assert(activeVoiceProvider.name === "NONE", "Active voice provider defaults to NONE");
    assert(activeVoiceProvider.status === "NOT_CONNECTED", "Provider status is NOT_CONNECTED");
    assert(activeVoiceProvider.isConfigured() === false, "isConfigured returns false");

    const validation = await activeVoiceProvider.validateConfiguration();
    assert(validation.valid === false, "validateConfiguration returns false when provider is disconnected");

    // Attempting dispatch must be safely rejected
    const dispatchResult = await activeVoiceProvider.dispatchCall({
      jobId: "job-123",
      campaignId: campaign.id,
      workspaceId: wsId,
      destinationPhoneE164: "+14155551234",
      scriptText: "Safety test",
      language: "en-US",
      voiceId: "alloy",
      speed: 1.0,
    });

    assert(dispatchResult.success === false, "dispatchCall returns success: false");
    assert(dispatchResult.status === "NOT_CONNECTED", "dispatchCall returns status: 'NOT_CONNECTED'");
    assert(dispatchResult.isSimulated === true, "dispatchCall returns isSimulated: true");
    assert(Boolean(dispatchResult.errorMessage), "Explicit descriptive error message returned");

  } finally {
    await prisma.workspace.delete({ where: { id: wsId } });
  }

  console.log("\n========================================================");
  console.log(`   AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runVoiceReportsSettingsAudit().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
