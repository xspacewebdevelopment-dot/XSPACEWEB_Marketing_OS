import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { suppressionService } from "../src/lib/services/suppression";

interface TestReport {
  name: string;
  category:
    | "MANUAL_SUPPRESSION"
    | "DUPLICATE_GUARD"
    | "BULK_IMPORT"
    | "SEARCH_FILTER"
    | "EXPORT_SAFETY"
    | "REMOVAL_AUDIT"
    | "COMPLIANCE_SECURITY"
    | "TENANT_ISOLATION"
    | "CREDIT_ZERO_CONSUMPTION"
    | "CAMPAIGN_ELIGIBILITY";
  passed: boolean;
  message?: string;
}

const testResults: TestReport[] = [];

function assert(
  condition: boolean,
  name: string,
  category: TestReport["category"],
  message?: string
) {
  if (condition) {
    testResults.push({ name, category, passed: true });
    console.log(`  [PASS] [${category}] ${name}`);
  } else {
    testResults.push({ name, category, passed: false, message });
    console.error(`  [FAIL] [${category}] ${name}: ${message || "Assertion failed"}`);
  }
}

async function runPhase5Tests() {
  console.log("=======================================================");
  console.log("  NEXAREACH PHASE 5: SUPPRESSION LIST TEST SUITE");
  console.log("  (Neon PostgreSQL Production Database Integrity)");
  console.log("=======================================================\n");

  const workspaceA = await prisma.workspace.findFirst({
    where: { name: { contains: "NexaReach" } },
  });

  const workspaceIdA = workspaceA?.id || "phase5-test-workspace-a";
  const workspaceIdB = "phase5-test-workspace-b-isolation";

  console.log(`[Workspace Target A]: ${workspaceIdA}`);
  console.log(`[Workspace Target B (Tenant Isolation)]: ${workspaceIdB}\n`);

  // Clean any previous test fixtures
  await prisma.suppressionAuditLog.deleteMany({
    where: { email: { contains: "phase5test" } },
  });
  await prisma.suppressionEntry.deleteMany({
    where: { normalizedEmail: { contains: "phase5test" } },
  });
  await prisma.contact.deleteMany({
    where: { email: { contains: "phase5test" } },
  });

  // Ensure Workspace B exists
  await prisma.workspace.upsert({
    where: { id: workspaceIdB },
    create: { id: workspaceIdB, name: "Workspace B Isolated Tenant" },
    update: {},
  });

  try {
    // -------------------------------------------------------------
    // TEST 1 — Add suppression without any contact existing
    // -------------------------------------------------------------
    console.log("--- 1. MANUAL SUPPRESSION TESTS ---");
    const standaloneEmail = "phase5test-standalone@nowhere-contact.com";

    // Verify contact does not exist
    const contactExists = await prisma.contact.findFirst({
      where: { workspaceId: workspaceIdA, normalizedEmail: standaloneEmail.toLowerCase() },
    });
    assert(!contactExists, "No contact record exists prior to suppression", "MANUAL_SUPPRESSION");

    const manualEntry = await suppressionService.addSuppression(workspaceIdA, {
      email: standaloneEmail,
      reason: "MANUAL_BLOCK",
      notes: "Internal risk mitigation without prior contact upload",
      source: "MANUAL",
      addedByUserId: "test-user-admin",
      addedByUserEmail: "admin@nexareach.com",
    });

    assert(!!manualEntry && manualEntry.id !== undefined, "Suppression entry successfully created", "MANUAL_SUPPRESSION");
    assert(manualEntry.normalizedEmail === standaloneEmail.toLowerCase(), "Email address correctly normalized", "MANUAL_SUPPRESSION");
    assert(manualEntry.status === "ACTIVE", "Entry initialized with ACTIVE status", "MANUAL_SUPPRESSION");
    assert(manualEntry.reason === "MANUAL_BLOCK", "Reason correctly recorded", "MANUAL_SUPPRESSION");

    // -------------------------------------------------------------
    // TEST 2 — Reject duplicate active entries
    // -------------------------------------------------------------
    console.log("\n--- 2. DUPLICATE GUARD TESTS ---");
    let duplicateRejected = false;
    try {
      await suppressionService.addSuppression(workspaceIdA, {
        email: standaloneEmail.toUpperCase(), // Same normalized email, different casing
        reason: "DO_NOT_CONTACT",
      });
    } catch (err: any) {
      duplicateRejected = err.message.includes("already actively suppressed");
    }
    assert(duplicateRejected, "Duplicate active suppression rejected with conflict error", "DUPLICATE_GUARD");

    // -------------------------------------------------------------
    // TEST 3 — Bulk import from dataset (CSV/XLSX abstraction)
    // -------------------------------------------------------------
    console.log("\n--- 3. BULK IMPORT TESTS ---");
    const importPayload = [
      { email: "phase5test-bulk1@example.com", reason: "DO_NOT_CONTACT" },
      { email: "phase5test-bulk2@example.com", reason: "UNSUBSCRIBED" },
      { email: "phase5test-bulk3@example.com", reason: "HARD_BOUNCE" },
      { email: "phase5test-bulk1@example.com", reason: "DO_NOT_CONTACT" }, // Duplicate within batch
      { email: standaloneEmail, reason: "MANUAL_BLOCK" }, // Already exists in DB
      { email: "invalid-not-an-email", reason: "MANUAL_BLOCK" }, // Invalid format
    ];

    const importResult = await suppressionService.bulkImportSuppressions(workspaceIdA, {
      entries: importPayload,
      source: "IMPORT",
      userId: "test-user-importer",
      userEmail: "ops@nexareach.com",
    });

    assert(importResult.totalRows === 6, "Accurately parsed 6 total rows", "BULK_IMPORT");
    assert(importResult.importedCount === 3, "Imported exactly 3 novel valid emails", "BULK_IMPORT");
    assert(importResult.skippedDuplicates === 2, "Identified 2 duplicates (1 batch duplicate + 1 DB duplicate)", "BULK_IMPORT");
    assert(importResult.invalidCount === 1, "Rejected 1 malformed email string", "BULK_IMPORT");

    // -------------------------------------------------------------
    // TEST 4 — Search and filter entries
    // -------------------------------------------------------------
    console.log("\n--- 4. SEARCH & FILTERING TESTS ---");
    const allQuery = await suppressionService.getSuppressions(workspaceIdA, {
      search: "phase5test",
      limit: 50,
    });
    assert(allQuery.entries.length === 4, "Search matches all 4 active test suppressions", "SEARCH_FILTER");

    const reasonQuery = await suppressionService.getSuppressions(workspaceIdA, {
      search: "phase5test",
      reason: "HARD_BOUNCE",
    });
    assert(reasonQuery.entries.length === 1, "Filter by HARD_BOUNCE isolates single matching entry", "SEARCH_FILTER");
    assert(reasonQuery.entries[0].normalizedEmail === "phase5test-bulk3@example.com", "Correct email returned by reason filter", "SEARCH_FILTER");

    const sourceQuery = await suppressionService.getSuppressions(workspaceIdA, {
      search: "phase5test",
      source: "MANUAL",
    });
    assert(sourceQuery.entries.length === 1, "Filter by MANUAL source isolates manual entry", "SEARCH_FILTER");

    // -------------------------------------------------------------
    // TEST 5 — Export suppressed emails (CSV & Formula Injection)
    // -------------------------------------------------------------
    console.log("\n--- 5. EXPORT & FORMULA INJECTION TESTS ---");
    // Add malicious payload starting with formula operator
    await suppressionService.addSuppression(workspaceIdA, {
      email: "phase5test-inject@calc.com",
      reason: "MANUAL_BLOCK",
      notes: "=1+1;cmd.exe|' /C calc'!A0",
    });

    const exportResult = await suppressionService.exportSuppressionsToCsv(workspaceIdA, {
      search: "phase5test",
    });

    assert(exportResult.rowCount >= 5, "Export returned all matching rows", "EXPORT_SAFETY");
    assert(exportResult.csvContent.startsWith("\uFEFF"), "Export contains UTF-8 BOM", "EXPORT_SAFETY");
    assert(exportResult.csvContent.includes("Email,Normalized Email,Reason"), "Contains standard CSV header", "EXPORT_SAFETY");
    // Verify formula note was escaped with single apostrophe
    assert(exportResult.csvContent.includes("'=1+1;cmd.exe"), "Formula injection string safely escaped with prepended apostrophe", "EXPORT_SAFETY");

    // -------------------------------------------------------------
    // TEST 6 & 7 — Removal, audit justification and compliance guard
    // -------------------------------------------------------------
    console.log("\n--- 6. REMOVAL, AUDIT & COMPLIANCE TESTS ---");
    // Lift manual block with valid justification
    const removedEntry = await suppressionService.removeSuppression(workspaceIdA, manualEntry.id, {
      removedByUserId: "test-user-admin",
      removedByUserEmail: "admin@nexareach.com",
      justification: "Client re-engaged with valid contract signed",
    });

    assert(removedEntry.status === "REMOVED", "Entry status transitioned to REMOVED", "REMOVAL_AUDIT");
    assert(!!removedEntry.removedAt, "Recorded exact removedAt timestamp", "REMOVAL_AUDIT");
    assert(removedEntry.removalJustification === "Client re-engaged with valid contract signed", "Recorded removal justification", "REMOVAL_AUDIT");

    // Attempt to remove an UNSUBSCRIBED entry without opt-in consent
    const unsubEntry = (await suppressionService.getSuppressions(workspaceIdA, {
      search: "phase5test-bulk2",
    })).entries[0];

    let unsubBlockedWithoutConsent = false;
    try {
      await suppressionService.removeSuppression(workspaceIdA, unsubEntry.id, {
        removedByUserId: "test-user-admin",
        justification: "Accidental test removal",
        confirmedRenewedConsent: false, // Not confirmed!
      });
    } catch (err: any) {
      unsubBlockedWithoutConsent = err.message.includes("renewed opt-in consent");
    }
    assert(unsubBlockedWithoutConsent, "Compliance guard prevents lifting UNSUBSCRIBED record without explicit renewed consent", "COMPLIANCE_SECURITY");

    // Audit log verification
    const auditLogs = await suppressionService.getSuppressionAuditHistory(workspaceIdA, manualEntry.normalizedEmail);
    assert(auditLogs.length >= 2, "Immutable audit trail records both ADDED and REMOVED events", "REMOVAL_AUDIT");
    assert(auditLogs[0].action === "REMOVED", "Latest audit log reflects REMOVED action", "REMOVAL_AUDIT");

    // -------------------------------------------------------------
    // TEST 8 — Tenant isolation (cross-workspace protection)
    // -------------------------------------------------------------
    console.log("\n--- 7. TENANT ISOLATION TESTS ---");
    const workspaceBEntries = await suppressionService.getSuppressions(workspaceIdB, {
      search: "phase5test",
    });
    assert(workspaceBEntries.entries.length === 0, "Workspace B cannot view Workspace A suppression entries", "TENANT_ISOLATION");

    let crossRemovalBlocked = false;
    try {
      await suppressionService.removeSuppression(workspaceIdB, unsubEntry.id, {
        removedByUserId: "intruder-user",
        justification: "Malicious attempt",
      });
    } catch (err: any) {
      crossRemovalBlocked = err.message.includes("not found in this workspace");
    }
    assert(crossRemovalBlocked, "Workspace B is blocked from modifying Workspace A suppressions", "TENANT_ISOLATION");

    // -------------------------------------------------------------
    // TEST 9 — Credit zero consumption
    // -------------------------------------------------------------
    console.log("\n--- 8. CREDIT ZERO CONSUMPTION TESTS ---");
    const initialLedgerCount = await prisma.verificationCreditLedger.count({
      where: { workspaceId: workspaceIdA },
    });
    // Check suppression and perform operations
    await suppressionService.checkSuppression(workspaceIdA, "phase5test-bulk1@example.com");
    await suppressionService.getSuppressionStats(workspaceIdA);

    const postLedgerCount = await prisma.verificationCreditLedger.count({
      where: { workspaceId: workspaceIdA },
    });
    assert(initialLedgerCount === postLedgerCount, "Zero verification credits consumed across all suppression operations", "CREDIT_ZERO_CONSUMPTION");

    // -------------------------------------------------------------
    // TEST 10 — Campaign Safety / Pre-send Recipient Eligibility
    // -------------------------------------------------------------
    console.log("\n--- 9. CAMPAIGN SAFETY ELIGIBILITY TESTS ---");
    const recipientTestList = [
      "phase5test-bulk1@example.com", // Suppressed (DO_NOT_CONTACT)
      "phase5test-bulk3@example.com", // Suppressed (HARD_BOUNCE)
      standaloneEmail,                // Was REMOVED, so it is ELIGIBLE!
      "clean-unsuppressed-user@domain.com", // Never suppressed, ELIGIBLE!
      "another-clean-lead@corp.org",        // Never suppressed, ELIGIBLE!
    ];

    const eligibility = await suppressionService.checkRecipientEligibility(workspaceIdA, recipientTestList);

    assert(eligibility.totalSubmitted === 5, "Processed 5 submitted recipient emails", "CAMPAIGN_ELIGIBILITY");
    assert(eligibility.excludedCount === 2, "Excluded exactly 2 actively suppressed recipients", "CAMPAIGN_ELIGIBILITY");
    assert(eligibility.eligibleCount === 3, "Allowed 3 eligible recipients including previously lifted block", "CAMPAIGN_ELIGIBILITY");
    assert(!eligibility.eligibleEmails.includes("phase5test-bulk1@example.com"), "Suppressed recipient excluded from dispatch list", "CAMPAIGN_ELIGIBILITY");
    assert(eligibility.eligibleEmails.includes("clean-unsuppressed-user@domain.com"), "Clean address preserved in dispatch list", "CAMPAIGN_ELIGIBILITY");

  } finally {
    // Teardown test fixtures
    await prisma.suppressionAuditLog.deleteMany({
      where: { email: { contains: "phase5test" } },
    });
    await prisma.suppressionEntry.deleteMany({
      where: { normalizedEmail: { contains: "phase5test" } },
    });
  }

  console.log("\n=======================================================");
  const passedCount = testResults.filter((r) => r.passed).length;
  const failedCount = testResults.filter((r) => !r.passed).length;
  console.log(`  TOTAL TESTS: ${testResults.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
