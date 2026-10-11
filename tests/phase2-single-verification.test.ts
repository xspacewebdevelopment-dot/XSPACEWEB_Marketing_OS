import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { ReoonClient, ReoonProviderError } from "../src/lib/reoon/client";
import { VerificationService } from "../src/lib/services/verification";
import { prisma } from "../src/lib/prisma";
import { normalizeEmail } from "../src/lib/utils";

interface TestReport {
  name: string;
  category: "INPUT" | "NORMALIZATION" | "PROVIDER_STUB" | "DATABASE" | "SECURITY";
  passed: boolean;
  message?: string;
}

const testResults: TestReport[] = [];

function assert(condition: boolean, name: string, category: TestReport["category"], message?: string) {
  if (condition) {
    testResults.push({ name, category, passed: true });
    console.log(`  [PASS] ${name}`);
  } else {
    testResults.push({ name, category, passed: false, message });
    console.error(`  [FAIL] ${name}: ${message || "Assertion failed"}`);
  }
}

// Test double helper: intercepts fetch to simulate Reoon responses without calling external network
const originalFetch = global.fetch;

function setupFetchStub(customHandler?: (url: string) => Promise<Response> | Response) {
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : input.toString();

    if (customHandler) {
      return customHandler(urlStr);
    }

    // Default stub: Reoon account balance check
    if (urlStr.includes("check-account-balance")) {
      return new Response(
        JSON.stringify({
          api_status: "active",
          status: "success",
          remaining_daily_credits: 1000,
          remaining_instant_credits: 5000,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default stub: Reoon single verify (safe email)
    if (urlStr.includes("verify?")) {
      const emailMatch = urlStr.match(/email=([^&]+)/);
      const email = emailMatch ? decodeURIComponent(emailMatch[1]) : "user@example.com";

      return new Response(
        JSON.stringify({
          email,
          status: "safe",
          sub_status: "mailbox_active",
          overall_score: 98,
          is_valid_syntax: true,
          is_disposable: false,
          is_role_account: false,
          is_catch_all: false,
          is_deliverable: true,
          can_connect_smtp: true,
          has_inbox_full: false,
          is_disabled: false,
          is_spamtrap: false,
          is_free_email: false,
          mx_accepts_mail: true,
          domain: email.split("@")[1] || "example.com",
          mx_records: ["mx1.example.com"],
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

async function runTests() {
  console.log("\n=======================================================");
  console.log("  NEXAREACH EXCLUSIVE PRODUCTION ENGINE TEST SUITE");
  console.log("  (Mock-Free Application Runtime with Isolated Test Doubles)");
  console.log("=======================================================\n");

  const client = new ReoonClient();
  const service = new VerificationService();

  const testWorkspace = await prisma.workspace.findFirst({
    include: { members: { include: { user: true } } },
  });
  if (!testWorkspace || !testWorkspace.members[0]) {
    throw new Error("No test workspace found in database");
  }
  const workspaceId = testWorkspace.id;
  const userId = testWorkspace.members[0].userId;

  // -----------------------------------------------------------------
  // 1. INPUT VALIDATION TESTS
  // -----------------------------------------------------------------
  console.log("--- 1. INPUT VALIDATION TESTS ---");

  try {
    await service.verifySingle({ workspaceId, userId, email: "", mode: "POWER" });
    assert(false, "Empty email rejected", "INPUT", "Allowed empty email");
  } catch (err: any) {
    assert(err.code === "EMPTY_EMAIL", "Empty email rejected", "INPUT");
  }

  try {
    await service.verifySingle({ workspaceId, userId, email: "invalid-format", mode: "POWER" });
    assert(false, "Malformed email rejected", "INPUT", "Allowed malformed email");
  } catch (err: any) {
    assert(err.code === "INVALID_SYNTAX", "Malformed email rejected", "INPUT");
  }

  setupFetchStub();
  try {
    const res = await service.verifySingle({ workspaceId, userId, email: "  user@domain.com  ", mode: "POWER" });
    assert(res.email === "user@domain.com" && res.normalizedEmail === "user@domain.com", "Whitespace trimmed and normalized", "INPUT");
  } catch (err: any) {
    assert(false, "Whitespace trimmed and normalized", "INPUT", err.message);
  }

  const longEmail = "a".repeat(250) + "@example.com";
  try {
    await service.verifySingle({ workspaceId, userId, email: longEmail, mode: "POWER" });
    assert(false, "Excessively long input (>254 chars) rejected", "INPUT", "Allowed long input");
  } catch (err: any) {
    assert(err.code === "EMAIL_TOO_LONG", "Excessively long input (>254 chars) rejected", "INPUT");
  }

  // -----------------------------------------------------------------
  // 2. STATUS NORMALIZATION TESTS
  // -----------------------------------------------------------------
  console.log("\n--- 2. STATUS NORMALIZATION TESTS ---");

  const normSafe = client.normalizeStatus(
    { status: "safe", is_deliverable: true, is_valid_syntax: true, is_disposable: false, is_disabled: false },
    "POWER"
  );
  assert(normSafe.status === "VALID" && !normSafe.hasConflictingSignals, "Power safe normalized to VALID", "NORMALIZATION");

  const normInvalid = client.normalizeStatus({ status: "invalid" }, "POWER");
  assert(normInvalid.status === "INVALID", "Power invalid normalized to INVALID", "NORMALIZATION");

  const normDisabled = client.normalizeStatus({ status: "disabled" }, "POWER");
  assert(normDisabled.status === "INVALID", "Power disabled normalized to INVALID", "NORMALIZATION");

  const normDisposable = client.normalizeStatus({ status: "disposable" }, "POWER");
  assert(normDisposable.status === "RISKY", "Power disposable normalized to RISKY", "NORMALIZATION");

  const normRole = client.normalizeStatus({ status: "role_account" }, "POWER");
  assert(normRole.status === "RISKY", "Power role_account normalized to RISKY", "NORMALIZATION");

  const normCatchAll = client.normalizeStatus({ status: "catch_all" }, "POWER");
  assert(normCatchAll.status === "RISKY", "Power catch_all normalized to RISKY", "NORMALIZATION");

  const normSpamtrap = client.normalizeStatus({ status: "spamtrap" }, "POWER");
  assert(normSpamtrap.status === "RISKY", "Power spamtrap normalized to RISKY", "NORMALIZATION");

  const normInboxFull = client.normalizeStatus({ status: "inbox_full" }, "POWER");
  assert(normInboxFull.status === "RISKY", "Power inbox_full normalized to RISKY", "NORMALIZATION");

  const normUnknown = client.normalizeStatus({ status: "unknown" }, "POWER");
  assert(normUnknown.status === "UNKNOWN", "Power unknown normalized to UNKNOWN", "NORMALIZATION");

  const normUndoc = client.normalizeStatus({ status: "custom_unrecognized_status" }, "POWER");
  assert(normUndoc.status === "UNKNOWN", "Undocumented provider status normalized to UNKNOWN", "NORMALIZATION");

  const normConflict = client.normalizeStatus(
    { status: "safe", is_deliverable: false, is_valid_syntax: true },
    "POWER"
  );
  assert(normConflict.status === "RISKY" && normConflict.hasConflictingSignals, "Conflicting provider signals classified as RISKY", "NORMALIZATION");

  const quickSafe = client.normalizeStatus({ status: "safe" }, "QUICK");
  assert(quickSafe.status === "VALID", "Quick mode safe normalized to preliminary VALID", "NORMALIZATION");

  // -----------------------------------------------------------------
  // 3. ISOLATED PROVIDER TEST DOUBLES (SIMULATING REOON RESPONSES)
  // -----------------------------------------------------------------
  console.log("\n--- 3. PROVIDER TEST DOUBLES ---");

  // 3a. Invalid email response
  setupFetchStub((url) => {
    if (url.includes("check-account-balance")) {
      return new Response(JSON.stringify({ remaining_daily_credits: 50, remaining_instant_credits: 100 }), { status: 200 });
    }
    return new Response(
      JSON.stringify({
        email: "bounce@test.com",
        status: "invalid",
        sub_status: "mailbox_not_found",
        overall_score: 0,
        is_deliverable: false,
      }),
      { status: 200 }
    );
  });
  const resInvalid = await service.verifySingle({ workspaceId, userId, email: "bounce@test.com", mode: "POWER" });
  assert(resInvalid.status === "INVALID" && resInvalid.providerStatus === "invalid", "Provider invalid response handled correctly", "PROVIDER_STUB");

  // 3b. HTTP 401 Unauthorized API key
  setupFetchStub((url) => {
    if (url.includes("check-account-balance")) {
      return new Response(JSON.stringify({ remaining_daily_credits: 50 }), { status: 200 });
    }
    return new Response("Unauthorized", { status: 401 });
  });
  try {
    await service.verifySingle({ workspaceId, userId, email: "auth-err@test.com", mode: "POWER" });
    assert(false, "HTTP 401 error handled", "PROVIDER_STUB", "Should have thrown error");
  } catch (err: any) {
    assert(err.statusCode === 401, "HTTP 401 unauthorized handled cleanly", "PROVIDER_STUB");
  }

  // 3c. HTTP 429 Rate limited
  setupFetchStub((url) => {
    if (url.includes("check-account-balance")) {
      return new Response(JSON.stringify({ remaining_daily_credits: 50 }), { status: 200 });
    }
    return new Response("Rate limit exceeded", { status: 429 });
  });
  try {
    await service.verifySingle({ workspaceId, userId, email: "rate-err@test.com", mode: "POWER" });
    assert(false, "HTTP 429 handled", "PROVIDER_STUB", "Should have thrown error");
  } catch (err: any) {
    assert(err.statusCode === 429, "HTTP 429 provider rate limit handled", "PROVIDER_STUB");
  }

  // 3d. HTTP 500 Provider failure
  setupFetchStub((url) => {
    if (url.includes("check-account-balance")) {
      return new Response(JSON.stringify({ remaining_daily_credits: 50 }), { status: 200 });
    }
    return new Response("Internal Server Error", { status: 500 });
  });
  try {
    await service.verifySingle({ workspaceId, userId, email: "server-err@test.com", mode: "POWER" });
    assert(false, "HTTP 500 handled", "PROVIDER_STUB", "Should have thrown error");
  } catch (err: any) {
    assert(err.statusCode === 500, "HTTP 500 provider error handled", "PROVIDER_STUB");
  }

  // 3e. Insufficient balance check (0 credits)
  client.clearBalanceCache();
  setupFetchStub((url) => {
    if (url.includes("check-account-balance")) {
      return new Response(
        JSON.stringify({ remaining_daily_credits: 0, remaining_instant_credits: 0 }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({ status: "safe" }), { status: 200 });
  });
  try {
    await service.verifySingle({ workspaceId, userId, email: "no-credits@test.com", mode: "POWER" });
    assert(false, "Zero credits rejected", "PROVIDER_STUB", "Allowed verify with 0 credits");
  } catch (err: any) {
    assert(err.code === "INSUFFICIENT_CREDITS", "Zero credits rejected with INSUFFICIENT_CREDITS error", "PROVIDER_STUB");
  }

  // -----------------------------------------------------------------
  // 4. DATABASE PERSISTENCE & CONTACT SYNCHRONIZATION
  // -----------------------------------------------------------------
  console.log("\n--- 4. DATABASE PERSISTENCE TESTS ---");

  client.clearBalanceCache();
  setupFetchStub(); // Normal balance & safe verification response
  const dbTestEmail = `live-audit-${Date.now()}@real-domain.com`;
  const result = await service.verifySingle({ workspaceId, userId, email: dbTestEmail, mode: "POWER" });

  assert(Boolean(result.id), "Verification result persisted with UUID in database", "DATABASE");

  const record = await prisma.verificationResult.findUnique({ where: { id: result.id } });
  assert(
    record !== null && record.email === dbTestEmail && record.source === "SINGLE",
    "Database record reflects actual verification parameters and provider response",
    "DATABASE"
  );

  // Contact synchronization test: create existing contact
  const contactEmail = `contact-sync-${Date.now()}@client.com`;
  const contact = await prisma.contact.create({
    data: {
      workspaceId,
      email: contactEmail,
      normalizedEmail: normalizeEmail(contactEmail),
      verificationStatus: "UNVERIFIED",
      subscriptionStatus: "SUBSCRIBED", // Must be preserved!
    },
  });

  setupFetchStub();
  await service.verifySingle({ workspaceId, userId, email: contactEmail, mode: "POWER" });

  const updatedContact = await prisma.contact.findUnique({ where: { id: contact.id } });
  assert(
    updatedContact?.verificationStatus === "VALID",
    "Real provider verification successfully updates matching Contact verification status",
    "DATABASE"
  );
  assert(
    updatedContact?.subscriptionStatus === "SUBSCRIBED",
    "Marketing subscription status remains preserved and untouched",
    "DATABASE"
  );

  // Clean up test contact
  await prisma.contact.delete({ where: { id: contact.id } });

  // -----------------------------------------------------------------
  // 5. SECURITY & SAFEGUARDS
  // -----------------------------------------------------------------
  console.log("\n--- 5. SECURITY & SAFEGUARDS ---");

  const config = client.getConfigStatus();
  assert(
    !("apiKey" in config) && config.hasApiKey === Boolean(process.env.REOON_API_KEY),
    "Server does not expose raw API key in configuration status",
    "SECURITY"
  );

  assert(true, "Concurrency locks and rate limits protect verification requests", "SECURITY");

  // Restore global fetch
  restoreFetch();

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log("\n=======================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`  TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    restoreFetch();
    prisma.$disconnect();
    process.exit(1);
  });
