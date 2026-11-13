/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { voiceCampaignService } from "../src/lib/services/voice-campaigns";

async function runVoiceCampaignsAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH VOICE CAMPAIGNS - SYSTEM AUDIT             ");
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

  // 1. Setup isolated test workspaces
  const ws1 = await prisma.workspace.create({
    data: { name: `Voice Audit WS1 - ${Date.now()}` },
  });
  const ws2 = await prisma.workspace.create({
    data: { name: `Voice Audit WS2 - ${Date.now()}` },
  });

  const ws1Id = ws1.id;
  const ws2Id = ws2.id;

  try {
    // ------------------------------------------------------------------------
    // 1. CAMPAIGN DRAFT CREATION & PROPERTY PERSISTENCE
    // ------------------------------------------------------------------------
    console.log("--- 1. Campaign Draft Creation & Property Validation ---");

    const draft = await voiceCampaignService.createCampaign(ws1Id, undefined, {
      name: "Q4 Automated Renewal Consultation",
      description: "Voice calls to annual subscribers to book renewal call",
      purpose: "REMINDER",
      status: "DRAFT",
      scriptText: "Hello {{firstName}}, this is {{company}} calling to remind you of your upcoming subscription renewal.",
      language: "en-US",
      voiceId: "alloy",
      speed: 1.05,
      pitch: 1.0,
      audienceType: "ALL",
    });

    assert(Boolean(draft.id), "Voice campaign draft created with valid ID", `ID: ${draft.id}`);
    assert(draft.name === "Q4 Automated Renewal Consultation", "Campaign name stored correctly");
    assert(draft.purpose === "REMINDER", "Purpose stored correctly");
    assert(draft.status === "DRAFT", "Status defaults to DRAFT");
    assert(draft.voiceId === "alloy", "Voice ID stored correctly");
    assert(draft.speed === 1.05, "Speaking speed stored correctly");

    // ------------------------------------------------------------------------
    // 2. MULTI-TENANT WORKSPACE ISOLATION
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Multi-Tenant Workspace Security Isolation ---");

    // Workspace 2 cannot see Workspace 1's voice campaigns
    const ws2List = await voiceCampaignService.listCampaigns(ws2Id);
    assert(ws2List.campaigns.length === 0, "Workspace 2 list is empty (cross-workspace isolation)");
    assert(ws2List.pagination.total === 0, "Workspace 2 total count is 0");

    // Workspace 2 cannot fetch Workspace 1 campaign by ID
    const crossFetch = await voiceCampaignService.getCampaignById(draft.id, ws2Id);
    assert(crossFetch === null, "Cross-workspace getCampaignById returns null");

    // Workspace 2 cannot update Workspace 1 campaign
    let crossUpdateBlocked = false;
    try {
      await voiceCampaignService.updateCampaign(draft.id, ws2Id, { name: "Malicious Tamper" });
    } catch {
      crossUpdateBlocked = true;
    }
    assert(crossUpdateBlocked, "Cross-workspace update is blocked with unauthorized error");

    // Workspace 2 cannot delete Workspace 1 campaign
    let crossDeleteBlocked = false;
    try {
      await voiceCampaignService.deleteCampaign(draft.id, ws2Id);
    } catch {
      crossDeleteBlocked = true;
    }
    assert(crossDeleteBlocked, "Cross-workspace delete is blocked with unauthorized error");

    // ------------------------------------------------------------------------
    // 3. EDIT DRAFT CAMPAIGN
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Edit Draft Properties & Status ---");

    const updated = await voiceCampaignService.updateCampaign(draft.id, ws1Id, {
      name: "Q4 Automated Renewal Consultation - Updated",
      speed: 1.1,
      voiceId: "echo",
    });

    assert(updated.name === "Q4 Automated Renewal Consultation - Updated", "Updated campaign name persisted");
    assert(updated.speed === 1.1, "Updated speed persisted");
    assert(updated.voiceId === "echo", "Updated voiceId persisted");

    // ------------------------------------------------------------------------
    // 4. CAMPAIGN DUPLICATION
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Campaign Duplication ---");

    const duplicated = await voiceCampaignService.duplicateCampaign(draft.id, ws1Id);
    assert(Boolean(duplicated.id), "Duplicated campaign created with new ID");
    assert(duplicated.id !== draft.id, "Duplicated campaign ID is unique");
    assert(duplicated.name === `Copy of ${updated.name}`, "Duplicated name has 'Copy of' prefix");
    assert(duplicated.status === "DRAFT", "Duplicated campaign resets to DRAFT status");
    assert(duplicated.scriptText === updated.scriptText, "Script content cloned faithfully");

    // ------------------------------------------------------------------------
    // 5. SCHEDULE & CANCEL TRANSITIONS
    // ------------------------------------------------------------------------
    console.log("\n--- 5. Scheduling & Cancellation Lifecycle ---");

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 hours
    const scheduled = await voiceCampaignService.updateCampaign(duplicated.id, ws1Id, {
      status: "SCHEDULED",
      scheduledAt: futureDate,
    });
    assert(scheduled.status === "SCHEDULED", "Campaign transitioned to SCHEDULED status");
    assert(Boolean(scheduled.scheduledAt), "Scheduled date persisted");

    // Non-draft cannot be edited or deleted
    let editScheduledBlocked = false;
    try {
      await voiceCampaignService.updateCampaign(duplicated.id, ws1Id, { name: "Should Fail" });
    } catch {
      editScheduledBlocked = true;
    }
    assert(editScheduledBlocked, "Editing non-draft campaign is rejected with strict rule enforcement");

    let deleteScheduledBlocked = false;
    try {
      await voiceCampaignService.deleteCampaign(duplicated.id, ws1Id);
    } catch {
      deleteScheduledBlocked = true;
    }
    assert(deleteScheduledBlocked, "Deleting scheduled campaign is rejected with strict rule enforcement");

    // Cancel scheduled campaign
    const cancelled = await voiceCampaignService.cancelScheduledCampaign(duplicated.id, ws1Id);
    assert(cancelled.status === "CANCELLED", "Campaign transitioned to CANCELLED status");
    assert(Boolean(cancelled.cancelledAt), "Cancellation timestamp recorded");

    // ------------------------------------------------------------------------
    // 6. IDEMPOTENT CALL JOB CREATION (NO DUPLICATES)
    // ------------------------------------------------------------------------
    console.log("\n--- 6. Idempotent Call Job Creation ---");

    // Create eligible test contact
    await prisma.contact.create({
      data: {
        workspaceId: ws1Id,
        email: "alice.voice@example.com",
        normalizedEmail: "alice.voice@example.com",
        firstName: "Alice",
        phone: "+14155552671",
        phoneNormalized: "+14155552671",
        voiceConsent: "OPTED_IN",
      },
    });

    // Run job generation twice to test idempotency
    const run1 = await voiceCampaignService.generateInternalCallJobs(draft.id, ws1Id);
    assert(run1.createdJobsCount === 1, "First job generation creates 1 recipient call job");

    const run2 = await voiceCampaignService.generateInternalCallJobs(draft.id, ws1Id);
    assert(run2.createdJobsCount === 1, "Second job generation upserts idempotently (no duplicate jobs)");

    const totalJobs = await (prisma as any).voiceCallJob.count({
      where: { campaignId: draft.id },
    });
    assert(totalJobs === 1, "Total call jobs in database remains exactly 1 for recipient (no duplicates)");

    // ------------------------------------------------------------------------
    // 7. DRAFT DELETION
    // ------------------------------------------------------------------------
    console.log("\n--- 7. Draft Deletion ---");

    const deleteRes = await voiceCampaignService.deleteCampaign(draft.id, ws1Id);
    assert(deleteRes.success === true, "Draft deleted successfully");

    const verifyDeleted = await voiceCampaignService.getCampaignById(draft.id, ws1Id);
    assert(verifyDeleted === null, "Deleted campaign no longer exists in database");

  } finally {
    // Cleanup workspaces
    await prisma.workspace.deleteMany({
      where: { id: { in: [ws1Id, ws2Id] } },
    });
  }

  console.log("\n========================================================");
  console.log(`   AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runVoiceCampaignsAudit().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
