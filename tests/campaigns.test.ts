import { prisma } from "../src/lib/prisma";
import { campaignService } from "../src/lib/services/campaigns";
import { resendService } from "../src/lib/resend/client";
import {
  sanitizeEmailHtml,
  interpolatePersonalization,
  wrapInEmailContainer,
} from "../src/lib/templates/compiler";
import { normalizeEmail } from "../src/lib/utils";

async function runCampaignAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH EMAIL CAMPAIGNS MODULE - SYSTEM AUDIT     ");
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

  // Find or create test workspace
  let workspace = await prisma.workspace.findFirst({
    include: { members: true },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Audit Test Workspace",
        settings: { create: {} },
      },
      include: { members: true },
    });
  }

  const workspaceId = workspace.id;
  const testUserId = workspace.members[0]?.userId || null;

  console.log(`Using Workspace ID: ${workspaceId}\n`);

  // --------------------------------------------------------------------------
  // 1. CAMPAIGN CRUD & LIFECYCLE
  // --------------------------------------------------------------------------
  console.log("--- 1. Campaign CRUD & Lifecycle ---");

  const createdCampaign = await campaignService.createCampaign(workspaceId, testUserId || "", {
    name: "Q4 High-Yield Growth Campaign",
    description: "Multi-channel Q4 outbound push",
    type: "PROMOTIONAL",
    fromName: "Sarah from NexaReach",
    fromEmail: "growth@nexareach.com",
    replyTo: "growth-replies@nexareach.com",
    subject: "Accelerate your revenue engine in Q4",
    preheader: "Exclusive early access invite for select teams",
    compiledHtml: "<p>Hello {{first_name|there}}, check out our new features.</p>",
    postalAddress: "100 Innovation Way, Suite 400, San Francisco, CA 94105",
    batchSize: 50,
    batchDelayMs: 1000,
  });

  assert(Boolean(createdCampaign.id), "Create campaign draft", `ID: ${createdCampaign.id}`);
  assert(createdCampaign.status === "DRAFT", "Initial status is DRAFT");
  assert(createdCampaign.type === "PROMOTIONAL", "Campaign type matches PROMOTIONAL");

  // Save and reopen draft
  const updatedCampaign = await campaignService.updateCampaign(createdCampaign.id, workspaceId, {
    subject: "Accelerate your revenue engine in Q4 [Updated]",
    preheader: "Updated preheader snippet",
  });
  assert(
    updatedCampaign.subject === "Accelerate your revenue engine in Q4 [Updated]",
    "Save and reopen draft with updated subject"
  );

  // Duplicate campaign
  const duplicated = await campaignService.duplicateCampaign(createdCampaign.id, workspaceId, testUserId || "");
  assert(duplicated.name === "Q4 High-Yield Growth Campaign (Copy)", "Duplicate campaign preserves config");
  assert(duplicated.status === "DRAFT", "Duplicated campaign resets status to DRAFT");

  // Archive campaign
  const archived = await campaignService.archiveCampaign(duplicated.id, workspaceId);
  assert(archived.isArchived === true && archived.status === "ARCHIVED", "Archive campaign");

  // Delete draft
  const deletedRes = await campaignService.deleteCampaign(duplicated.id, workspaceId);
  assert(deletedRes.success === true, "Delete archived/draft campaign");

  // --------------------------------------------------------------------------
  // 2. AUDIENCE SELECTION, DEDUPLICATION & SUPPRESSION FILTERING
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Audience Selection, Deduplication & Suppression Exclusions ---");

  // Create isolated test contacts for audience evaluation
  const ts = Date.now();
  const contactA = await prisma.contact.create({
    data: {
      workspaceId,
      email: `valid.lead.a.${ts}@example.com`,
      normalizedEmail: normalizeEmail(`valid.lead.a.${ts}@example.com`),
      firstName: "Alice",
      lastName: "Adams",
      verificationStatus: "VALID",
      subscriptionStatus: "SUBSCRIBED",
    },
  });

  const contactB = await prisma.contact.create({
    data: {
      workspaceId,
      email: `valid.lead.b.${ts}@example.com`,
      normalizedEmail: normalizeEmail(`valid.lead.b.${ts}@example.com`),
      firstName: "Bob",
      lastName: "Baker",
      verificationStatus: "VALID",
      subscriptionStatus: "SUBSCRIBED",
    },
  });

  const contactSuppressed = await prisma.contact.create({
    data: {
      workspaceId,
      email: `suppressed.lead.${ts}@example.com`,
      normalizedEmail: normalizeEmail(`suppressed.lead.${ts}@example.com`),
      firstName: "Charlie",
      verificationStatus: "VALID",
      subscriptionStatus: "SUBSCRIBED",
    },
  });

  // Add suppression entry for contactSuppressed
  await prisma.suppressionEntry.create({
    data: {
      workspaceId,
      email: contactSuppressed.email,
      normalizedEmail: contactSuppressed.normalizedEmail,
      reason: "DO_NOT_CONTACT",
      source: "MANUAL",
      status: "ACTIVE",
    },
  });

  const contactUnsubscribed = await prisma.contact.create({
    data: {
      workspaceId,
      email: `optout.lead.${ts}@example.com`,
      normalizedEmail: normalizeEmail(`optout.lead.${ts}@example.com`),
      firstName: "David",
      verificationStatus: "VALID",
      subscriptionStatus: "UNSUBSCRIBED", // No marketing consent
    },
  });

  const contactInvalid = await prisma.contact.create({
    data: {
      workspaceId,
      email: `invalid.lead.${ts}@example.com`,
      normalizedEmail: normalizeEmail(`invalid.lead.${ts}@example.com`),
      firstName: "Eve",
      verificationStatus: "INVALID", // Verification Risk Guard
      subscriptionStatus: "SUBSCRIBED",
    },
  });

  // Create a list containing Contact A and Contact B
  const testList = await prisma.contactList.create({
    data: {
      workspaceId,
      name: `Q4 Test List ${ts}`,
      memberships: {
        create: [
          { contactId: contactA.id },
          { contactId: contactB.id },
          { contactId: contactSuppressed.id },
          { contactId: contactUnsubscribed.id },
          { contactId: contactInvalid.id },
        ],
      },
    },
  });

  // Calculate audience using both explicit contactId (Contact A) and testList (which also has Contact A -> duplicate test)
  const breakdown = await campaignService.calculateAudience(workspaceId, {
    contactIds: [contactA.id],
    listIds: [testList.id],
  });

  assert(breakdown.totalRaw === 6, "Total raw recipients identified across list and direct select", `Raw: ${breakdown.totalRaw}`);
  assert(breakdown.duplicates >= 1, "Deduplication catches overlapping contact occurrences", `Duplicates: ${breakdown.duplicates}`);
  assert(breakdown.suppressed >= 1, "Suppression engine excludes active suppression registry matches", `Suppressed: ${breakdown.suppressed}`);
  assert(breakdown.unsubscribed >= 1, "Consent enforcement excludes unsubscribed/opted-out contacts", `Unsubscribed: ${breakdown.unsubscribed}`);
  assert(breakdown.invalidOrRisky >= 1, "Risk guard excludes INVALID/RISKY verified mailboxes", `Invalid/Risky: ${breakdown.invalidOrRisky}`);
  assert(breakdown.eligible === 2, "Net eligible recipients strictly computed (Alice & Bob only)", `Eligible: ${breakdown.eligible}`);

  // Test Exclusion List
  const exclusionList = await prisma.contactList.create({
    data: {
      workspaceId,
      name: `Exclusion List ${ts}`,
      memberships: {
        create: [{ contactId: contactB.id }],
      },
    },
  });

  const breakdownWithExclusion = await campaignService.calculateAudience(workspaceId, {
    listIds: [testList.id],
    excludedListIds: [exclusionList.id],
  });

  assert(
    breakdownWithExclusion.eligible === 1,
    "Audience exclusion list removes member from final eligible pool",
    `Eligible with exclusion: ${breakdownWithExclusion.eligible}`
  );

  // --------------------------------------------------------------------------
  // 3. MERGE TAGS, PERSONALIZATION & SECURITY SANITIZATION
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Merge Tags, Personalization & Content Sanitization ---");

  const dirtyHtml = `
    <div>
      <script>stealTokens();</script>
      <a href="javascript:alert(1)">Click here</a>
      <h2 onclick="runBad()">Hi {{first_name|Valued Customer}}</h2>
      <p>Company: {{company|Your Organization}} &bull; Email: {{email}}</p>
      <a href="https://example.com/pricing">Pricing</a>
    </div>
  `;

  const sanitized = sanitizeEmailHtml(dirtyHtml);
  assert(!sanitized.includes("<script>"), "Security: Strips dangerous <script> tags");
  assert(!sanitized.includes("javascript:"), "Security: Strips javascript: link protocols");
  assert(!sanitized.includes("onclick="), "Security: Strips inline DOM event handlers");

  const personalized = interpolatePersonalization(dirtyHtml, {
    first_name: "Alice",
    company: "Acme Innovations",
    email: "alice@example.com",
    unsubscribe_url: "https://nexareach.com/unsubscribe?token=sample-test",
  });

  assert(personalized.includes("Hi Alice"), "Merge tag {{first_name}} correctly interpolated");
  assert(personalized.includes("Company: Acme Innovations"), "Merge tag {{company}} correctly interpolated");

  // Test fallback
  const fallbackTest = interpolatePersonalization("<p>Hello {{first_name|friend}}</p>", {});
  assert(fallbackTest.includes("Hello friend"), "Safe fallback rendered when contact field is missing");

  // UTM Parameters Injection
  const htmlWithUtm = campaignService.appendUtmParams(
    '<a href="https://example.com/demo">Book Demo</a>',
    { source: "nexareach", medium: "email", campaign: "q4_blast" }
  );
  assert(
    htmlWithUtm.includes("utm_source=nexareach") && htmlWithUtm.includes("utm_campaign=q4_blast"),
    "UTM query parameters correctly appended to outbound links"
  );

  // --------------------------------------------------------------------------
  // 4. PROVIDER TEST DOUBLE & BATCH SENDING
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Resend Sending Engine & Provider Test Doubles ---");

  // Attach eligible audience to campaign
  await prisma.campaign.update({
    where: { id: createdCampaign.id },
    data: {
      audienceConfig: { listIds: [testList.id] },
    },
  });

  const snapshotCount = await campaignService.snapshotRecipients(createdCampaign.id, workspaceId);
  assert(snapshotCount === 2, "Recipient snapshot records materialized in database", `Snapshots: ${snapshotCount}`);

  // Test Idempotent snapshot reload
  const reloadSnapshotCount = await campaignService.snapshotRecipients(createdCampaign.id, workspaceId);
  assert(reloadSnapshotCount === 2, "Snapshot materialization is idempotent (no duplicates created)");

  // Mock Resend Provider to prevent real emails from being dispatched during automated test
  const originalSendEmail = resendService.sendEmail;
  let simulatedCallCount = 0;

  (resendService as any).sendEmail = async (options: any) => {
    simulatedCallCount++;
    return {
      success: true,
      messageId: `msg_test_double_${simulatedCallCount}_${Date.now()}`,
      from: options.from,
      to: options.to,
      statusCode: 200,
    };
  };

  // Transition campaign to SENDING
  await prisma.campaign.update({
    where: { id: createdCampaign.id },
    data: { status: "SENDING", startedAt: new Date() },
  });

  const batchResult = await campaignService.processBatch(createdCampaign.id, 10);
  assert(batchResult.submitted === 2, "Batch processor successfully dispatches eligible snapshot recipients", `Submitted: ${batchResult.submitted}`);
  assert(batchResult.hasMore === false, "Batch processor completes all pending snapshots");

  // Verify snapshots updated to SUBMITTED
  const submittedSnapshots = await prisma.campaignRecipientSnapshot.findMany({
    where: { campaignId: createdCampaign.id, status: "SUBMITTED" },
  });
  assert(submittedSnapshots.length === 2, "Recipient snapshots status updated to SUBMITTED");
  assert(Boolean(submittedSnapshots[0].providerMessageId), "Provider message ID saved on snapshot record");

  // Verify immutable EmailEvents created
  const events = await prisma.emailEvent.findMany({
    where: { campaignId: createdCampaign.id, eventType: "SUBMITTED" },
  });
  assert(events.length === 2, "Immutable EmailEvent audit records created in Neon");

  // Verify Campaign status transitions to COMPLETED
  const completedCamp = await prisma.campaign.findUnique({
    where: { id: createdCampaign.id },
  });
  assert(completedCamp?.status === "COMPLETED", "Campaign automatically transitions to COMPLETED upon finish");
  assert(completedCamp?.submittedCount === 2, "Campaign submittedCount accurately aggregated");

  // --------------------------------------------------------------------------
  // 5. RESEND PROVIDER ERROR HANDLING
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Provider Error Handling & Partial Failures ---");

  // Create another campaign for error simulation
  const errorCamp = await campaignService.createCampaign(workspaceId, testUserId || "", {
    name: "Error Simulation Campaign",
    fromName: "Test",
    fromEmail: "test@domain.com",
    subject: "Test Failures",
    compiledHtml: "<p>Hello</p>",
    audienceConfig: { contactIds: [contactA.id] },
  });

  await campaignService.snapshotRecipients(errorCamp.id, workspaceId);
  await prisma.campaign.update({
    where: { id: errorCamp.id },
    data: { status: "SENDING" },
  });

  // Mock Resend to return provider error
  (resendService as any).sendEmail = async () => ({
    success: false,
    error: "Domain not verified on provider account: test@domain.com",
  });

  const errBatch = await campaignService.processBatch(errorCamp.id, 10);
  assert(errBatch.failed === 1, "Failed Resend submission captured cleanly without crashing process");

  const failedSnapshot = await prisma.campaignRecipientSnapshot.findFirst({
    where: { campaignId: errorCamp.id, status: "FAILED" },
  });
  assert(
    failedSnapshot?.errorMessage?.includes("Domain not verified"),
    "Diagnostic error message persisted on recipient snapshot"
  );

  // Restore original Resend service method
  resendService.sendEmail = originalSendEmail;

  // --------------------------------------------------------------------------
  // 6. SCHEDULING, CANCELLATION, PAUSE & RESUME
  // --------------------------------------------------------------------------
  console.log("\n--- 6. Scheduling, Cancellation & State Controls ---");

  const schedCamp = await campaignService.createCampaign(workspaceId, testUserId || "", {
    name: "Scheduled Webinar Invite",
    fromName: "Events Team",
    fromEmail: "events@nexareach.com",
    subject: "Webinar on Thursday",
    compiledHtml: "<p>Webinar link</p>",
    audienceConfig: { contactIds: [contactA.id] },
  });

  // Future UTC time
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const scheduled = await campaignService.scheduleCampaign(schedCamp.id, workspaceId, futureDate, "America/New_York");
  assert(scheduled.status === "SCHEDULED", "Campaign transitions to SCHEDULED status");
  assert(scheduled.timezone === "America/New_York", "Timezone persisted on campaign record");

  // Cancel scheduled campaign
  const cancelled = await campaignService.cancelCampaign(schedCamp.id, workspaceId);
  assert(cancelled.status === "CANCELLED", "Cancel campaign transitions status to CANCELLED");

  // Pause & Resume test
  const pauseCamp = await campaignService.createCampaign(workspaceId, testUserId || "", {
    name: "Pause/Resume Test",
    fromName: "Test",
    fromEmail: "test@domain.com",
    subject: "Pause Test",
    compiledHtml: "<p>Pause</p>",
  });

  await prisma.campaign.update({
    where: { id: pauseCamp.id },
    data: { status: "SENDING" },
  });

  const paused = await campaignService.pauseCampaign(pauseCamp.id, workspaceId);
  assert(paused.status === "PAUSED", "Pause campaign transitions to PAUSED");

  const resumed = await campaignService.resumeCampaign(pauseCamp.id, workspaceId);
  assert(resumed.status === "SENDING", "Resume campaign transitions back to SENDING");

  // --------------------------------------------------------------------------
  // 7. FUNCTIONAL UNSUBSCRIBE & SUPPRESSION SYNCHRONIZATION
  // --------------------------------------------------------------------------
  console.log("\n--- 7. Functional Unsubscribe & Instant Suppression Sync ---");

  // Get one of our submitted snapshots
  const testSnapshot = submittedSnapshots[0];
  const unsubsResult = await campaignService.handleUnsubscribe(testSnapshot.unsubscribeToken);

  assert(unsubsResult.success === true, "Unsubscribe handler resolves successfully with token");

  // Verify SuppressionEntry created with reason UNSUBSCRIBED
  const suppression = await prisma.suppressionEntry.findFirst({
    where: {
      workspaceId,
      normalizedEmail: testSnapshot.normalizedEmail,
      status: "ACTIVE",
    },
  });
  assert(Boolean(suppression), "Unsubscribed contact automatically added to shared Suppression List");
  assert(suppression?.reason === "UNSUBSCRIBED", "Suppression reason set to UNSUBSCRIBED");

  // Verify Contact subscriptionStatus updated
  const updatedContact = await prisma.contact.findFirst({
    where: { id: testSnapshot.contactId! },
  });
  assert(updatedContact?.subscriptionStatus === "UNSUBSCRIBED", "Contact subscriptionStatus updated to UNSUBSCRIBED");

  // Verify Campaign unsubscribedCount incremented
  const campAfterUnsub = await prisma.campaign.findUnique({
    where: { id: createdCampaign.id },
  });
  assert(campAfterUnsub?.unsubscribedCount === 1, "Campaign unsubscribedCount counter incremented");

  // --------------------------------------------------------------------------
  // 8. REPORTING & CSV EXPORT
  // --------------------------------------------------------------------------
  console.log("\n--- 8. Campaign Reports & CSV Export ---");

  const reportData = await campaignService.getCampaignReport(createdCampaign.id, workspaceId);
  assert(Boolean(reportData.campaign), "Campaign report returns verified campaign details");
  assert(reportData.campaign.submittedCount === 2, "Report shows real submitted count without fabrication");

  const csv = await campaignService.exportReportCsv(createdCampaign.id, workspaceId);
  assert(csv.includes("Recipient Email,First Name"), "CSV contains expected report header structure");
  assert(csv.includes(testSnapshot.email), "CSV includes recipient audit row");

  // --------------------------------------------------------------------------
  // 9. CLEANUP TEST DATA
  // --------------------------------------------------------------------------
  console.log("\n--- 9. Cleaning Up Test Fixtures ---");
  await prisma.campaign.deleteMany({
    where: {
      id: { in: [createdCampaign.id, errorCamp.id, schedCamp.id, pauseCamp.id] },
    },
  });
  await prisma.contactList.deleteMany({
    where: { id: { in: [testList.id, exclusionList.id] } },
  });
  await prisma.contact.deleteMany({
    where: {
      id: { in: [contactA.id, contactB.id, contactSuppressed.id, contactUnsubscribed.id, contactInvalid.id] },
    },
  });
  await prisma.suppressionEntry.deleteMany({
    where: {
      workspaceId,
      normalizedEmail: { in: [contactSuppressed.normalizedEmail, testSnapshot.normalizedEmail] },
    },
  });
  console.log("Cleaned test fixtures successfully.");

  console.log("\n========================================================");
  console.log(`  CAMPAIGN AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCampaignAudit().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
