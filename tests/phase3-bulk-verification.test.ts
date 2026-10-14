import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import * as XLSX from "xlsx";
import { ReoonClient, ReoonProviderError } from "../src/lib/reoon/client";
import { VerificationService, VerificationServiceError } from "../src/lib/services/verification";
import { prisma } from "../src/lib/prisma";
import {
  parseFileContent,
  analyzeEmailColumn,
  detectEmailColumn,
  isValidEmailSyntax,
} from "../src/lib/file-parser";
import { inngestFunctions } from "../src/inngest/functions";

interface TestReport {
  name: string;
  category:
    | "FILE_PARSING"
    | "EMAIL_ANALYSIS"
    | "PROVIDER_DOUBLES"
    | "DATABASE_PERSISTENCE"
    | "CSV_EXPORT"
    | "SECURITY_ISOLATION"
    | "INNGEST_WORKFLOW";
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

// Global fetch test double
const originalFetch = global.fetch;

function setupFetchStub(customHandler?: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : input.toString();

    if (customHandler) {
      return customHandler(urlStr, init);
    }

    // Default balance check stub
    if (urlStr.includes("check-account-balance")) {
      return new Response(
        JSON.stringify({
          api_status: "active",
          status: "success",
          remaining_daily_credits: 500,
          remaining_instant_credits: 2500,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default bulk task create stub
    if (urlStr.includes("create-bulk-verification-task")) {
      let bodyData: any = {};
      if (init?.body) {
        try {
          bodyData = JSON.parse(init.body as string);
        } catch {}
      }
      const emails = bodyData.emails || [];

      return new Response(
        JSON.stringify({
          status: "success",
          task_id: 999888,
          count_submitted: emails.length,
          count_duplicates_removed: 0,
          count_rejected_emails: 0,
          count_processing: emails.length,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default bulk task results / polling stub
    if (urlStr.includes("get-result-bulk-verification-task")) {
      return new Response(
        JSON.stringify({
          task_id: 999888,
          status: "completed",
          count_total: 2,
          count_checked: 2,
          progress_percentage: 100,
          results: {
            "lead1@example.com": {
              email: "lead1@example.com",
              status: "safe",
              sub_status: "ok",
              domain: "example.com",
              is_deliverable: true,
              is_disposable: false,
              is_role_account: false,
              is_catch_all: false,
              overall_score: 95,
            },
            "invalid@domain.invalid": {
              email: "invalid@domain.invalid",
              status: "invalid",
              sub_status: "mailbox_not_found",
              domain: "domain.invalid",
              is_deliverable: false,
              is_disposable: false,
              overall_score: 0,
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return originalFetch(input, init);
  };
}

function restoreFetch() {
  global.fetch = originalFetch;
}

async function runPhase3Tests() {
  console.log("\n=======================================================");
  console.log("  NEXAREACH PHASE 3: BULK EMAIL VERIFICATION TEST SUITE");
  console.log("  (Production Engine Verification with Isolated Test Doubles)");
  console.log("=======================================================\n");

  const client = new ReoonClient();
  const service = new VerificationService();

  // Load a test workspace from Neon PostgreSQL
  const testWorkspace = await prisma.workspace.findFirst({
    include: { members: { include: { user: true } } },
  });

  if (!testWorkspace) {
    throw new Error("Neon PostgreSQL test workspace could not be located");
  }

  const workspaceId = testWorkspace.id;
  const userId = testWorkspace.members[0]?.userId;

  console.log(`[Workspace Target]: ${testWorkspace.name} (${workspaceId})\n`);

  // --- 1. FILE PARSING & COLUMN DETECTION TESTS ---
  console.log("--- 1. FILE PARSING & COLUMN DETECTION TESTS ---");
  {
    // A. CSV parsing with standard header
    const csvContent = "First Name,Email Address,Company\nJohn,john@example.com,Acme\nJane,jane@acme.org,Corp";
    const csvResult = parseFileContent("leads.csv", csvContent);
    assert(csvResult.fileType === "CSV", "CSV format correctly detected", "FILE_PARSING");
    assert(csvResult.totalRowCount === 2, "CSV row count parsed accurately", "FILE_PARSING");
    assert(csvResult.headers[1] === "Email Address", "CSV headers extracted", "FILE_PARSING");
    assert(csvResult.suggestedEmailColumnIndex === 1, "Email column auto-detected by header", "FILE_PARSING");

    // B. Semicolon delimited CSV
    const semiContent = "Name;Email;Phone\nAlice;alice@test.com;1234\nBob;bob@test.com;5678";
    const semiResult = parseFileContent("contacts.csv", semiContent);
    assert(semiResult.headers.length === 3, "Semicolon delimited file parsed", "FILE_PARSING");
    assert(semiResult.suggestedEmailColumnIndex === 1, "Semicolon file email column mapped", "FILE_PARSING");

    // C. TXT file (one email per line)
    const txtContent = "alpha@example.com\nbeta@example.com\ngamma@example.com\n";
    const txtResult = parseFileContent("subscribers.txt", txtContent);
    assert(txtResult.fileType === "TXT", "TXT format detected", "FILE_PARSING");
    assert(txtResult.totalRowCount === 3, "TXT lines parsed as rows", "FILE_PARSING");
    assert(txtResult.suggestedEmailColumnIndex === 0, "TXT column mapped to column 0", "FILE_PARSING");

    // D. XLSX file parsing using binary workbook
    const ws = XLSX.utils.aoa_to_sheet([
      ["First Name", "Contact Mail", "Title"],
      ["Dev", "dev@company.com", "Engineer"],
      ["Manager", "mgr@company.com", "Lead"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    const xlsxBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const xlsxResult = parseFileContent("list.xlsx", xlsxBuffer);
    assert(xlsxResult.fileType === "XLSX", "XLSX workbook format detected", "FILE_PARSING");
    assert(xlsxResult.totalRowCount === 2, "XLSX rows parsed correctly", "FILE_PARSING");
    assert(xlsxResult.suggestedEmailColumnIndex === 1, "XLSX email column detected by header keyword", "FILE_PARSING");

    // E. Column detection without email in header (detects from cell contents)
    const noHeaderContent = "Col A,Col B,Col C\n123,john.doe@test.com,NYC\n456,jane.doe@test.com,LON";
    const noHeaderResult = parseFileContent("raw.csv", noHeaderContent);
    assert(noHeaderResult.suggestedEmailColumnIndex === 1, "Email column detected by sample row content inspection", "FILE_PARSING");

    // F. Empty file handling
    const emptyResult = parseFileContent("empty.csv", "");
    assert(emptyResult.totalRowCount === 0, "Empty file returns 0 rows safely", "FILE_PARSING");
  }

  // --- 2. EMAIL ANALYSIS & DEDUPLICATION TESTS ---
  console.log("\n--- 2. EMAIL ANALYSIS & DEDUPLICATION TESTS ---");
  {
    const rows = [
      ["John", "Alpha@Example.com"],
      ["Duplicate", "alpha@example.com"], // exact duplicate (case insensitive)
      ["Whitespace", "  alpha@example.com  "], // duplicate after trimming
      ["Bob", "bob@valid.com"],
      ["Malformed1", "not-an-email"],
      ["Malformed2", "@missing-user.com"],
      ["Malformed3", "user@missingtld"],
      ["Jane", "jane@company.com"],
    ];

    const analysis = analyzeEmailColumn(rows, 1);
    assert(analysis.totalRows === 8, "Total rows counted correctly", "EMAIL_ANALYSIS");
    assert(analysis.uniqueValidCount === 3, "Unique valid count isolates 3 addresses (alpha, bob, jane)", "EMAIL_ANALYSIS");
    assert(analysis.duplicateCount === 2, "Duplicate count identifies 2 duplicates", "EMAIL_ANALYSIS");
    assert(analysis.malformedCount === 3, "Malformed count identifies 3 invalid addresses", "EMAIL_ANALYSIS");
    assert(analysis.estimatedCredits === 3, "Credit requirement equals unique valid count", "EMAIL_ANALYSIS");
    assert(analysis.uniqueEmails.includes("Alpha@Example.com"), "Retains original casing for verified payload", "EMAIL_ANALYSIS");
  }

  // --- 3. PROVIDER TEST DOUBLES & BULK LIFECYCLE ---
  console.log("\n--- 3. PROVIDER TEST DOUBLES & BULK LIFECYCLE ---");
  {
    setupFetchStub();

    // A. Reoon bulk task creation
    const createRes = await client.createBulkTask(["test1@example.com", "test2@example.com"], "unit_test");
    assert(createRes.status === "success", "Reoon bulk task creation succeeds", "PROVIDER_DOUBLES");
    assert(Number(createRes.task_id) === 999888, "Task ID returned from provider", "PROVIDER_DOUBLES");
    assert(createRes.count_processing === 2, "Processing count matches submitted unique count", "PROVIDER_DOUBLES");

    // B. Reoon bulk polling: running state
    setupFetchStub(async (url) => {
      if (url.includes("get-result-bulk-verification-task")) {
        return new Response(
          JSON.stringify({
            task_id: 999888,
            status: "running",
            count_total: 10,
            count_checked: 4,
            progress_percentage: 40.0,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(url);
    });

    const runningProgress = await client.getBulkTaskProgress("999888");
    assert(runningProgress.status === "PROCESSING", "Provider running state maps to PROCESSING", "PROVIDER_DOUBLES");
    assert(runningProgress.progressPercentage === 40, "Progress percentage parsed accurately", "PROVIDER_DOUBLES");
    assert(!runningProgress.isFinished, "isFinished is false while running", "PROVIDER_DOUBLES");

    // C. Reoon bulk polling: completed state
    setupFetchStub(async (url) => {
      if (url.includes("get-result-bulk-verification-task")) {
        return new Response(
          JSON.stringify({
            task_id: 999888,
            status: "completed",
            count_total: 2,
            count_checked: 2,
            progress_percentage: 100.0,
            results: {
              "safe@domain.com": {
                email: "safe@domain.com",
                status: "safe",
                sub_status: "mailbox_active",
                is_deliverable: true,
                is_disposable: false,
                overall_score: 98,
              },
              "fake@tempmail.com": {
                email: "fake@tempmail.com",
                status: "disposable",
                sub_status: "temp_domain",
                is_deliverable: false,
                is_disposable: true,
                overall_score: 10,
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(url);
    });

    const completedProgress = await client.getBulkTaskProgress("999888");
    assert(completedProgress.status === "COMPLETED", "Provider completed state maps to COMPLETED", "PROVIDER_DOUBLES");
    assert(completedProgress.isFinished === true, "isFinished is true on completed task", "PROVIDER_DOUBLES");
    assert(completedProgress.results?.length === 2, "Results array normalized from dictionary", "PROVIDER_DOUBLES");
    assert(completedProgress.results?.[0].status === "VALID", "Safe item normalized to VALID", "PROVIDER_DOUBLES");
    assert(completedProgress.results?.[1].status === "RISKY", "Disposable item normalized to RISKY", "PROVIDER_DOUBLES");

    // D. Insufficient credits on task creation
    setupFetchStub(async (url) => {
      if (url.includes("create-bulk-verification-task")) {
        return new Response(
          JSON.stringify({
            status: "error",
            reason: "Insufficient credits available on your account",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(url);
    });

    let creditErrorThrown = false;
    try {
      await client.createBulkTask(["user@example.com"]);
    } catch (err) {
      if (err instanceof ReoonProviderError && err.code === "INSUFFICIENT_CREDITS") {
        creditErrorThrown = true;
      }
    }
    assert(creditErrorThrown, "Insufficient provider credits triggers INSUFFICIENT_CREDITS error", "PROVIDER_DOUBLES");

    // E. Rate limit HTTP 429 handled
    setupFetchStub(async (url) => {
      if (url.includes("create-bulk-verification-task")) {
        return new Response("Too Many Requests", { status: 429 });
      }
      return originalFetch(url);
    });

    let rateLimitThrown = false;
    try {
      await client.createBulkTask(["user@example.com"]);
    } catch (err) {
      if (err instanceof ReoonProviderError && err.code === "RATE_LIMITED") {
        rateLimitThrown = true;
      }
    }
    assert(rateLimitThrown, "Provider HTTP 429 handled as RATE_LIMITED", "PROVIDER_DOUBLES");

    // F. Max 50,000 email limit validation
    let limitExceededThrown = false;
    try {
      const massiveList = new Array(50001).fill("test@example.com");
      await client.createBulkTask(massiveList);
    } catch (err) {
      if (err instanceof ReoonProviderError && err.code === "LIMIT_EXCEEDED") {
        limitExceededThrown = true;
      }
    }
    assert(limitExceededThrown, "Requests exceeding 50,000 emails rejected per Reoon documentation", "PROVIDER_DOUBLES");

    restoreFetch();
  }

  // --- 4. DATABASE PERSISTENCE & JOB LIFECYCLE ---
  console.log("\n--- 4. DATABASE PERSISTENCE & JOB LIFECYCLE ---");
  {
    setupFetchStub();

    // A. Create bulk job through VerificationService
    const createdJob = await service.createBulkJob({
      workspaceId,
      userId,
      filename: "test_leads.csv",
      sourceType: "CSV",
      fileSize: 1024,
      emails: ["bulk_test_1@example.com", "bulk_test_2@example.com"],
      duplicatesCount: 1,
      rejectedCount: 1,
    });

    assert(Boolean(createdJob.id), "VerificationJob persisted with UUID in database", "DATABASE_PERSISTENCE");
    assert(createdJob.status === "PROCESSING", "Job initialized in PROCESSING state after provider dispatch", "DATABASE_PERSISTENCE");
    assert(createdJob.providerJobId === "999888", "Provider task ID recorded on database job", "DATABASE_PERSISTENCE");
    assert(createdJob.totalRecords === 2, "Total records recorded", "DATABASE_PERSISTENCE");

    // B. Poll job status to trigger completion and result storage
    setupFetchStub(async (url) => {
      if (url.includes("get-result-bulk-verification-task")) {
        return new Response(
          JSON.stringify({
            task_id: 999888,
            status: "completed",
            count_total: 2,
            count_checked: 2,
            progress_percentage: 100.0,
            results: {
              "bulk_test_1@example.com": {
                email: "bulk_test_1@example.com",
                status: "safe",
                sub_status: "mailbox_active",
                is_deliverable: true,
                is_disposable: false,
                is_role_account: false,
                is_catch_all: false,
                overall_score: 95,
              },
              "bulk_test_2@example.com": {
                email: "bulk_test_2@example.com",
                status: "invalid",
                sub_status: "mailbox_not_found",
                is_deliverable: false,
                is_disposable: false,
                is_role_account: false,
                is_catch_all: false,
                overall_score: 5,
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(url);
    });

    const finalizedJob = await service.pollJobStatus(createdJob.id, workspaceId);
    assert(finalizedJob.status === "COMPLETED", "Job status updated to COMPLETED in database", "DATABASE_PERSISTENCE");
    assert(finalizedJob.validCount === 1, "validCount updated in database", "DATABASE_PERSISTENCE");
    assert(finalizedJob.invalidCount === 1, "invalidCount updated in database", "DATABASE_PERSISTENCE");
    assert(finalizedJob.progressPercentage === 100, "Progress percentage is 100%", "DATABASE_PERSISTENCE");

    // C. Verify VerificationResult records exist in database
    const resultsInDb = await prisma.verificationResult.findMany({
      where: { jobId: createdJob.id, workspaceId },
    });
    assert(resultsInDb.length === 2, "Itemized VerificationResult records persisted in Neon PostgreSQL", "DATABASE_PERSISTENCE");
    assert(resultsInDb.some((r) => r.status === "VALID"), "Valid result record matches schema", "DATABASE_PERSISTENCE");
    assert(resultsInDb.some((r) => r.status === "INVALID"), "Invalid result record matches schema", "DATABASE_PERSISTENCE");
    assert(resultsInDb[0].source === "BULK", "VerificationResult source set to BULK", "DATABASE_PERSISTENCE");

    // D. Verify VerificationCreditLedger entry
    const ledgerEntry = await prisma.verificationCreditLedger.findFirst({
      where: { workspaceId, providerReference: createdJob.id },
    });
    assert(Boolean(ledgerEntry), "Credit ledger audit entry recorded for bulk verification", "DATABASE_PERSISTENCE");
    assert(ledgerEntry?.creditsUsed === 2, "Ledger reflects confirmed credits consumed", "DATABASE_PERSISTENCE");
    assert(ledgerEntry?.operation === "BULK_VERIFY", "Ledger operation labeled BULK_VERIFY", "DATABASE_PERSISTENCE");

    restoreFetch();
  }

  // --- 5. CSV EXPORT CORRECTNESS ---
  console.log("\n--- 5. CSV EXPORT CORRECTNESS ---");
  {
    // Locate the completed job
    const job = await prisma.verificationJob.findFirst({
      where: { workspaceId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    });

    if (job) {
      // A. Export all results
      const allExport = await service.exportJobResultsCsv(job.id, workspaceId, "all");
      assert(allExport.csv.includes("Email,Status,Provider Status"), "CSV header correctly generated", "CSV_EXPORT");
      assert(allExport.csv.includes("bulk_test_1@example.com"), "CSV contains verified email record", "CSV_EXPORT");
      assert(allExport.filename.endsWith(".csv"), "Export filename formatted with .csv extension", "CSV_EXPORT");

      // B. Export valid only
      const validExport = await service.exportJobResultsCsv(job.id, workspaceId, "valid");
      assert(validExport.csv.includes("bulk_test_1@example.com"), "Valid export includes valid email", "CSV_EXPORT");
      assert(!validExport.csv.includes("bulk_test_2@example.com"), "Valid export excludes invalid email", "CSV_EXPORT");
    }
  }

  // --- 6. SECURITY & WORKSPACE ISOLATION ---
  console.log("\n--- 6. SECURITY & WORKSPACE ISOLATION ---");
  {
    const foreignWorkspaceId = "00000000-0000-0000-0000-000000000000";

    const job = await prisma.verificationJob.findFirst({
      where: { workspaceId },
    });

    if (job) {
      let crossTenantBlocked = false;
      try {
        await service.pollJobStatus(job.id, foreignWorkspaceId);
      } catch (err) {
        if (err instanceof VerificationServiceError && err.statusCode === 404) {
          crossTenantBlocked = true;
        }
      }
      assert(crossTenantBlocked, "Unauthorized foreign workspace cannot access or poll job", "SECURITY_ISOLATION");

      let crossTenantExportBlocked = false;
      try {
        await service.exportJobResultsCsv(job.id, foreignWorkspaceId, "all");
      } catch (err) {
        if (err instanceof VerificationServiceError && err.statusCode === 404) {
          crossTenantExportBlocked = true;
        }
      }
      assert(crossTenantExportBlocked, "Foreign workspace cannot export other tenant results", "SECURITY_ISOLATION");
    }

    // Local cancellation integrity
    const cancelJobTarget = await prisma.verificationJob.create({
      data: {
        workspaceId,
        filename: "cancel_test.csv",
        status: "PROCESSING",
        providerJobId: "999888",
        totalRecords: 1,
      },
    });

    const cancelled = await service.cancelJob(cancelJobTarget.id, workspaceId);
    assert(cancelled.status === "CANCELLED", "Job marked CANCELLED locally", "SECURITY_ISOLATION");
    assert(Boolean(cancelled.cancelledAt), "Cancelled timestamp recorded", "SECURITY_ISOLATION");
    assert(
      Boolean(cancelled.errorMessage?.includes("Remote Reoon verification task continues independently")),
      "Disclaimer preserved that provider task cannot be recalled remotely",
      "SECURITY_ISOLATION"
    );
  }

  // --- 7. INNGEST WORKFLOW DEFINITION ---
  console.log("\n--- 7. INNGEST WORKFLOW DEFINITION ---");
  {
    assert(inngestFunctions.length >= 2, "Inngest registered functions includes bulk verification", "INNGEST_WORKFLOW");
    const bulkFunc = inngestFunctions.find((f: any) => f.id() === "nexareach-process-bulk-verification");
    assert(Boolean(bulkFunc), "Process bulk verification Inngest function registered with id nexareach-process-bulk-verification", "INNGEST_WORKFLOW");
  }

  // Print Summary
  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.filter((t) => !t.passed).length;

  console.log("\n=======================================================");
  console.log(`  TOTAL TESTS: ${testResults.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log("=======================================================\n");

  await prisma.$disconnect();
  process.exit(failedCount > 0 ? 1 : 0);
}

runPhase3Tests().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
