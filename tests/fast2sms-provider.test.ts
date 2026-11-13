import assert from "node:assert";
import { Fast2SmsProvider } from "@/lib/sms/fast2sms-provider";
import { smsCampaignService } from "@/lib/services/sms-campaigns";
import { prisma } from "@/lib/prisma";

// Mock fetch wrapper to intercept HTTP requests
let interceptedRequests: Array<{ url: string; options: any }> = [];
let mockFetchHandler: (url: string, options: any) => Promise<any> = async () => {
  throw new Error("Unhandled fetch call in test");
};

const originalFetch = global.fetch;

function setupMockFetch(handler: (url: string, options: any) => Promise<any>) {
  interceptedRequests = [];
  mockFetchHandler = handler;
  global.fetch = (async (url: any, options: any) => {
    interceptedRequests.push({ url: String(url), options });
    return mockFetchHandler(String(url), options);
  }) as any;
}

function restoreFetch() {
  global.fetch = originalFetch;
  interceptedRequests = [];
}

async function runFast2SmsAudit() {
  console.log("\n========================================================");
  console.log("   FAST2SMS & RCS PROVIDER ADAPTER - PRODUCTION AUDIT   ");
  console.log("========================================================\n");

  const testProvider = new Fast2SmsProvider();

  try {
    // ------------------------------------------------------------------------
    // 1. INDIAN PHONE NORMALIZATION & CARRIER VALIDATION
    // ------------------------------------------------------------------------
    console.log("--- 1. Indian Phone Normalization & Carrier Route Validation ---");

    // Valid Indian phone formatted with +91
    const validIn1 = testProvider.normalizeIndianPhone("+919876543210");
    assert(validIn1.isValid === true, "Valid Indian phone with +91 is accepted");
    assert(validIn1.tenDigitNumber === "9876543210", "Strips country code to 10-digit national number");
    assert(validIn1.e164 === "+919876543210", "Extracts valid E.164");
    console.log("  ✅ PASS: Normalized +919876543210 to national 10 digits (9876543210)");

    // Valid Indian phone entered as 10 digits
    const validIn2 = testProvider.normalizeIndianPhone("9123456789");
    assert(validIn2.isValid === true, "Valid 10-digit Indian phone is accepted");
    assert(validIn2.tenDigitNumber === "9123456789", "Retains 10 digits");
    assert(validIn2.e164 === "+919123456789", "Adds verified E.164 prefix");
    console.log("  ✅ PASS: Normalized local 10 digits to E.164 (+919123456789)");

    // Rejection of non-Indian numbers (US)
    const usNumber = testProvider.normalizeIndianPhone("+14155552671");
    assert(usNumber.isValid === false, "US number rejected by Fast2SMS provider");
    assert(usNumber.error?.includes("only supports Indian mobile numbers"), "Returns explicit country mismatch error");
    console.log("  ✅ PASS: Rejected non-Indian (+1) number with descriptive country error");

    // Rejection of non-Indian numbers (UK)
    const ukNumber = testProvider.normalizeIndianPhone("+447400123456");
    assert(ukNumber.isValid === false, "UK number rejected by Fast2SMS provider");
    console.log("  ✅ PASS: Rejected non-Indian (+44) number");

    // Rejection of invalid/malformed strings
    const invalidShort = testProvider.normalizeIndianPhone("12345");
    assert(invalidShort.isValid === false, "Short number rejected");
    console.log("  ✅ PASS: Rejected malformed/short phone string");

    // ------------------------------------------------------------------------
    // 2. WALLET CONNECTION TEST (ZERO-COST STATUS CHECK)
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Non-Destructive Wallet Balance & Connection Test ---");

    // Mock successful wallet balance response
    setupMockFetch(async (url, options) => {
      assert(url === "https://www.fast2sms.com/dev/wallet", "Calls official wallet endpoint");
      assert(options.method === "POST", "Uses POST method");
      assert(Boolean(options.headers.Authorization), "Passes Authorization header");
      return {
        ok: true,
        json: async () => ({
          return: true,
          wallet: 245.75,
        }),
      };
    });

    const walletSuccess = await testProvider.testConnection();
    assert(walletSuccess.success === true, "Connection test succeeds");
    assert(walletSuccess.walletBalance === 245.75, "Parses wallet balance correctly");
    assert(walletSuccess.currency === "INR", "Reports currency as INR");
    console.log("  ✅ PASS: Successfully retrieved wallet balance (₹245.75) without sending messages");

    // Mock 412 Unauthorized response
    setupMockFetch(async () => {
      return {
        ok: false,
        status: 412,
        statusText: "Unauthorized",
        json: async () => ({
          return: false,
          status_code: 412,
          message: "Invalid authorization key",
        }),
      };
    });

    const walletFailAuth = await testProvider.testConnection();
    assert(walletFailAuth.success === false, "Reports failure on invalid authorization");
    assert(walletFailAuth.statusCode === 412, "Captures 412 status code");
    console.log("  ✅ PASS: Handled 412 Invalid Authorization Key error gracefully");

    // ------------------------------------------------------------------------
    // 3. SAFE SIMULATION MODE (ZERO NETWORK CALLS)
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Safe Simulation Mode Guard ---");

    setupMockFetch(async () => {
      throw new Error("NETWORK CALL DETECTED IN SIMULATION MODE!");
    });

    const simResult = await testProvider.sendSms({
      recipientPhone: "+919876543210",
      messageText: "Test simulated message",
      isLive: false, // Local simulation
    });

    assert(simResult.success === true, "Simulation returns success");
    assert(simResult.isSimulated === true, "Explicitly flagged as isSimulated: true");
    assert(simResult.status === "SIMULATED", "Status is SIMULATED");
    assert(simResult.deliveryState === "SIMULATED_LOCAL", "Delivery state is SIMULATED_LOCAL");
    assert(simResult.requestId?.startsWith("sim_f2s_"), "Generates local simulation ID");
    assert(interceptedRequests.length === 0, "Zero network requests made in simulation mode");
    console.log("  ✅ PASS: Safe simulation mode executed locally with ZERO network calls");

    // ------------------------------------------------------------------------
    // 4. LIVE QUICK SMS DISPATCH PAYLOAD & HEADERS (MOCKED)
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Live Quick SMS (route=q) Request Formatting ---");

    let capturedPayload: any = null;
    let capturedHeaders: any = null;

    setupMockFetch(async (url, options) => {
      assert(url === "https://www.fast2sms.com/dev/bulkV2", "Dispatches to bulkV2 endpoint");
      assert(options.method === "POST", "Uses POST");
      capturedHeaders = options.headers;
      capturedPayload = JSON.parse(options.body);

      return {
        ok: true,
        json: async () => ({
          return: true,
          request_id: "fst_req_mock_98765",
          message: ["Message sent successfully"],
        }),
      };
    });

    const liveQuickResult = await testProvider.sendSms({
      recipientPhone: "+919876543210",
      messageText: "Hello from NexaReach OS test",
      route: "q",
      isLive: true,
    });

    assert(liveQuickResult.success === true, "Live dispatch succeeds");
    assert(liveQuickResult.status === "SUBMITTED_TO_CARRIER", "Status is SUBMITTED_TO_CARRIER (not DELIVERED)");
    assert(liveQuickResult.deliveryState === "PENDING_DELIVERY_CONFIRMATION", "Delivery state is pending DLR");
    assert(liveQuickResult.requestId === "fst_req_mock_98765", "Captures provider request_id");
    assert(capturedPayload.route === "q", "Sets route to 'q'");
    assert(capturedPayload.numbers === "9876543210", "Payload numbers contains 10-digit format");
    assert(capturedPayload.message === "Hello from NexaReach OS test", "Payload message matches");
    assert(capturedPayload.flash === 0, "Sets flash to 0");
    assert(Boolean(capturedHeaders.Authorization), "Passes Authorization header");
    console.log("  ✅ PASS: Formatted Quick SMS payload and recorded SUBMITTED_TO_CARRIER status");

    // ------------------------------------------------------------------------
    // 5. LIVE DLT SMS DISPATCH PAYLOAD (MOCKED)
    // ------------------------------------------------------------------------
    console.log("\n--- 5. Live DLT SMS (route=dlt) Request Formatting ---");

    setupMockFetch(async (_url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          return: true,
          request_id: "fst_dlt_mock_12345",
          message: ["Message sent successfully"],
        }),
      };
    });

    const liveDltResult = await testProvider.sendSms({
      recipientPhone: "+919876543210",
      messageText: "Your OTP is 123456",
      route: "dlt",
      senderId: "FSTSMS",
      dltTemplateId: "1207161234567890",
      variablesValues: "123456",
      isLive: true,
    });

    assert(liveDltResult.success === true, "DLT dispatch succeeds");
    assert(capturedPayload.route === "dlt", "Sets route to 'dlt'");
    assert(capturedPayload.sender_id === "FSTSMS", "Includes verified DLT sender ID");
    assert(capturedPayload.message === "1207161234567890", "Message is DLT template ID");
    assert(capturedPayload.variables_values === "123456", "Includes DLT variables");
    console.log("  ✅ PASS: Formatted DLT payload with sender_id, template ID, and variables");

    // Missing DLT parameters validation
    const missingDltTemplate = await testProvider.sendSms({
      recipientPhone: "+919876543210",
      messageText: "Test",
      route: "dlt",
      senderId: "FSTSMS",
      // missing dltTemplateId
      isLive: true,
    });
    assert(missingDltTemplate.success === false, "Rejects DLT dispatch without template ID");
    assert(missingDltTemplate.error?.includes("DLT route requires an approved DLT Template ID"), "Returns descriptive error");
    console.log("  ✅ PASS: Rejected DLT dispatch when template ID is missing");

    // ------------------------------------------------------------------------
    // 6. ERROR CODES HANDLING (416 INSUFFICIENT BALANCE, 999 VERIFICATION)
    // ------------------------------------------------------------------------
    console.log("\n--- 6. Provider Error Code Mapping ---");

    // 416 Insufficient Wallet Balance
    setupMockFetch(async () => {
      return {
        ok: true,
        json: async () => ({
          return: false,
          status_code: 416,
          message: ["Insufficient wallet balance"],
        }),
      };
    });

    const lowBalanceResult = await testProvider.sendSms({
      recipientPhone: "+919876543210",
      messageText: "Test",
      isLive: true,
    });

    assert(lowBalanceResult.success === false, "Reports failure on insufficient balance");
    assert(lowBalanceResult.statusCode === 416, "Captures 416 status code");
    assert(lowBalanceResult.error?.includes("Insufficient Fast2SMS wallet balance"), "Maps to user-friendly message");
    console.log("  ✅ PASS: Handled 416 Insufficient Wallet Balance error");

    // 999 Minimum Transaction Verification Needed
    setupMockFetch(async () => {
      return {
        ok: true,
        json: async () => ({
          return: false,
          status_code: 999,
          message: ["Complete minimum transaction verification"],
        }),
      };
    });

    const unverifiedResult = await testProvider.sendSms({
      recipientPhone: "+919876543210",
      messageText: "Test",
      isLive: true,
    });

    assert(unverifiedResult.success === false, "Reports failure on code 999");
    assert(unverifiedResult.statusCode === 999, "Captures 999 status code");
    assert(unverifiedResult.error?.includes("minimum transaction verification"), "Maps to clear guidance");
    console.log("  ✅ PASS: Handled 999 Account Verification requirement");

    // ------------------------------------------------------------------------
    // 7. RCS OUTBOUND REJECTION (NOT_CONNECTED)
    // ------------------------------------------------------------------------
    console.log("\n--- 7. RCS Protocol Safety & Rejection ---");

    setupMockFetch(async () => {
      throw new Error("RCS NETWORK CALL ATTEMPTED!");
    });

    const rcsResult = await testProvider.sendRcs({
      recipientPhone: "+919876543210",
      messageText: "RCS rich card test",
      cardTitle: "Special Offer",
      isLive: true,
    });

    assert(rcsResult.success === false, "RCS dispatch is rejected");
    assert(rcsResult.status === "NOT_CONNECTED", "Status is NOT_CONNECTED");
    assert(rcsResult.error.includes("Fast2SMS does not expose an automated outbound REST API for RCS"), "Returns accurate explanation");
    assert(interceptedRequests.length === 0, "Zero network requests attempted for RCS");
    console.log("  ✅ PASS: Outbound RCS dispatch safely rejected with NOT_CONNECTED status");

    // ------------------------------------------------------------------------
    // 8. SERVICE LAYER INTEGRATION & SAFEGUARDS (DATABASE-SCOPED)
    // ------------------------------------------------------------------------
    console.log("\n--- 8. Service Layer Safeguards (Consent, Suppression & Confirmation) ---");

    // Find or create a test workspace
    const ws = await prisma.workspace.findFirst();
    const wsId = ws?.id || "ws_test_f2s_safeguards";

    // 8.1 Confirmation guard (confirmLiveSend: false is blocked)
    let rejectedNoConfirm = false;
    try {
      await smsCampaignService.executeSingleTestSend(wsId, {
        phone: "+919876543210",
        messageText: "Test",
        confirmLiveSend: false,
      });
    } catch (err: any) {
      rejectedNoConfirm = true;
      assert(err.message.includes("Live send confirmation required"), "Error mentions confirmation requirement");
    }
    assert(rejectedNoConfirm, "Blocked live send when confirmLiveSend is false");
    console.log("  ✅ PASS: Blocked unconfirmed send (confirmLiveSend: false required)");

    // 8.2 Non-Indian number blocked at service layer
    let rejectedNonIn = false;
    try {
      await smsCampaignService.executeSingleTestSend(wsId, {
        phone: "+14155552671",
        messageText: "Test",
        confirmLiveSend: true,
      });
    } catch (err: any) {
      rejectedNonIn = true;
      assert(err.message.includes("Fast2SMS only supports Indian mobile numbers"), "Error mentions country restriction");
    }
    assert(rejectedNonIn, "Blocked non-Indian recipient at service layer");
    console.log("  ✅ PASS: Blocked non-Indian number at service layer");

    const emailStr = `f2s_pending_${Date.now()}@example.com`;
    const testPendingContact = await prisma.contact.create({
      data: {
        workspaceId: wsId,
        email: emailStr,
        normalizedEmail: emailStr,
        phone: "+919876543299",
        phoneNormalized: "+919876543299",
        smsConsent: "PENDING",
      },
    });

    let rejectedPending = false;
    try {
      await smsCampaignService.executeSingleTestSend(wsId, {
        phone: "+919876543299",
        messageText: "Test",
        confirmLiveSend: true,
      });
    } catch (err: any) {
      rejectedPending = true;
      assert(err.message.includes("SMS consent is 'PENDING'"), "Error mentions pending consent");
    }
    assert(rejectedPending, "Blocked send to contact with PENDING consent");
    console.log("  ✅ PASS: Blocked test send to contact with PENDING SMS consent");

    // Clean up test contact
    await prisma.contact.delete({ where: { id: testPendingContact.id } }).catch(() => {});

    console.log("\n========================================================");
    console.log("   AUDIT COMPLETE: ALL FAST2SMS UNIT TESTS PASSED       ");
    console.log("========================================================\n");
  } finally {
    restoreFetch();
  }
}

runFast2SmsAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failure:", err);
    process.exit(1);
  });
