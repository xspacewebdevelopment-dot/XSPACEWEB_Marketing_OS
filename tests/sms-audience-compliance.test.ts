/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { contactsService } from "../src/lib/services/contacts";
import { suppressionService } from "../src/lib/services/suppression";
import { smsCampaignService } from "../src/lib/services/sms-campaigns";
import {
  parseAndNormalizePhoneNumber,
  isValidPhoneNumber,
  formatPhoneNumber,
} from "../src/lib/sms/phone";
import { POST as audienceRouteHandler } from "../src/app/api/dashboard/sms-rcs/campaigns/audience/route";
import { NextRequest } from "next/server";

async function runSmsAudienceComplianceAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH SMS AUDIENCE & COMPLIANCE - RIGOROUS AUDIT ");
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

  // Setup isolated test workspaces
  const ws1 = await prisma.workspace.create({
    data: { name: `SMS Compliance WS1 - ${Date.now()}` },
  });
  const ws2 = await prisma.workspace.create({
    data: { name: `SMS Compliance WS2 - ${Date.now()}` },
  });

  const ws1Id = ws1.id;
  const ws2Id = ws2.id;

  try {
    // ------------------------------------------------------------------------
    // 1. INTERNATIONAL PHONE NUMBER FORMATS & E.164 NORMALIZATION
    // ------------------------------------------------------------------------
    console.log("--- 1. International Phone Parsing, Country-Aware Normalization ---");

    const testNumbers = [
      { raw: "+1 (415) 555-2671", expectedE164: "+14155552671", expectedCountry: "US", name: "United States" },
      { raw: "+44 7400 123456", expectedE164: "+447400123456", expectedCountry: "GB", name: "United Kingdom" },
      { raw: "+91 98765 43210", expectedE164: "+919876543210", expectedCountry: "IN", name: "India" },
      { raw: "+33 6 12 34 56 78", expectedE164: "+33612345678", expectedCountry: "FR", name: "France" },
      { raw: "+49 151 23456789", expectedE164: "+4915123456789", expectedCountry: "DE", name: "Germany" },
      { raw: "+61 412 345 678", expectedE164: "+61412345678", expectedCountry: "AU", name: "Australia" },
    ];

    for (const item of testNumbers) {
      const res = parseAndNormalizePhoneNumber(item.raw);
      assert(res.isValid === true, `Parsed valid number for ${item.name}`);
      assert(res.e164 === item.expectedE164, `E.164 format for ${item.name} (${res.e164})`);
      assert(res.country === item.expectedCountry, `Country code for ${item.name} (${res.country})`);
      assert(isValidPhoneNumber(item.raw), `isValidPhoneNumber returns true for ${item.name}`);
      assert(Boolean(formatPhoneNumber(item.raw)), `formatPhoneNumber returns international display`);
    }

    // Verify phone number field preservation in Contacts service
    const contactUk = await contactsService.createContact(ws1Id, {
      email: "uk.recipient@example.co.uk",
      firstName: "Oliver",
      lastName: "Smith",
      phone: "+44 7400 123456",
      smsConsent: "OPTED_IN",
    });

    assert(contactUk.phone === "+44 7400 123456", "Original phone field preserved in Contact record");
    assert((contactUk as any).phoneNormalized === "+447400123456", "Separately stored normalized E.164 value");
    assert((contactUk as any).phoneCountry === "GB", "Stored country code GB without assuming US formatting");

    // ------------------------------------------------------------------------
    // 2. INVALID PHONE NUMBERS REJECTION & HANDLING
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Invalid Phone Number Detection ---");

    const invalidInputs = [
      "not-a-phone-number",
      "12345",
      "++12345678",
      "abcdefghij",
      "+1 000 000 0000",
      "",
    ];

    for (const invalid of invalidInputs) {
      const parsed = parseAndNormalizePhoneNumber(invalid);
      assert(parsed.isValid === false, `Correctly flagged "${invalid}" as invalid`);
      assert(parsed.e164 === null, `Normalized E.164 is null for "${invalid}"`);
      assert(isValidPhoneNumber(invalid) === false, `isValidPhoneNumber returns false for "${invalid}"`);
    }

    // ------------------------------------------------------------------------
    // 3. DEFAULT PENDING CONSENT & NEVER INFERRING OPT-IN
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Default PENDING Consent & No Opt-In Inferred ---");

    // Create a contact without supplying smsConsent
    const pendingContact = await contactsService.createContact(ws1Id, {
      email: "pending.consent@example.com",
      firstName: "Jane",
      lastName: "Doe",
      phone: "+1 415 555 2671",
      subscriptionStatus: "SUBSCRIBED", // Email is SUBSCRIBED, but SMS must NOT be inferred as opted-in!
    });

    assert((pendingContact as any).smsConsent === "PENDING", "Default SMS consent is strictly PENDING");
    assert(pendingContact.subscriptionStatus === "SUBSCRIBED", "Email subscriptionStatus remains preserved");

    // Calculate audience: pending contact must be excluded from eligible recipients
    const audiencePendingCheck = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "ALL",
    });

    assert(
      audiencePendingCheck.excludedContacts.some(
        (c) => c.id === pendingContact.id && c.reasonCode === "CONSENT_PENDING"
      ),
      "Pending SMS contact excluded with reasonCode 'CONSENT_PENDING'"
    );

    // ------------------------------------------------------------------------
    // 4. OPT-IN / OPT-OUT TRANSITIONS & IMMUTABLE AUDIT LOGS
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Consent Transitions & Audit Trail ---");

    // Transition from PENDING -> OPTED_IN
    const optedInContact = await contactsService.updateContactSmsConsent(ws1Id, pendingContact.id, {
      consent: "OPTED_IN",
      source: "KEYWORD_START",
      performedByUserId: "user-admin-123",
      performedByUserEmail: "admin@example.com",
      notes: "Customer texted START keyword to shortcode",
    });

    assert((optedInContact as any).smsConsent === "OPTED_IN", "Contact transitioned to OPTED_IN");
    assert((optedInContact as any).smsConsentSource === "KEYWORD_START", "Source stored as KEYWORD_START");
    assert(Boolean((optedInContact as any).smsConsentTimestamp), "Consent timestamp recorded");

    // Verify audit log entry
    const auditsAfterOptIn = await contactsService.getContactConsentAudits(ws1Id, pendingContact.id);
    assert(auditsAfterOptIn.length >= 1, "Consent audit log entry created");
    assert(auditsAfterOptIn[0].previousStatus === "PENDING", "Audit log recorded previousStatus PENDING");
    assert(auditsAfterOptIn[0].newStatus === "OPTED_IN", "Audit log recorded newStatus OPTED_IN");
    assert(auditsAfterOptIn[0].source === "KEYWORD_START", "Audit log recorded source KEYWORD_START");
    assert(auditsAfterOptIn[0].performedByUserId === "user-admin-123", "Audit log recorded performedByUserId");

    // Verify contact is now eligible for SMS
    const audienceAfterOptIn = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "ALL",
    });
    assert(
      audienceAfterOptIn.eligibleContacts.some((c) => c.id === pendingContact.id),
      "Opted-in contact is now in eligible recipients list"
    );

    // Transition from OPTED_IN -> OPTED_OUT
    const optedOutContact = await contactsService.updateContactSmsConsent(ws1Id, pendingContact.id, {
      consent: "OPTED_OUT",
      source: "KEYWORD_STOP",
      performedByUserId: "user-admin-123",
      notes: "Customer replied STOP",
    });

    assert((optedOutContact as any).smsConsent === "OPTED_OUT", "Contact transitioned to OPTED_OUT");
    assert(Boolean((optedOutContact as any).smsOptOutTimestamp), "smsOptOutTimestamp timestamp set");

    const auditsAfterOptOut = await contactsService.getContactConsentAudits(ws1Id, pendingContact.id);
    assert(auditsAfterOptOut[0].newStatus === "OPTED_OUT", "Audit log recorded newStatus OPTED_OUT");
    assert(auditsAfterOptOut[0].source === "KEYWORD_STOP", "Audit log recorded source KEYWORD_STOP");

    // Explicit opt-out must block eligibility
    const audienceAfterOptOut = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "ALL",
    });
    assert(
      audienceAfterOptOut.excludedContacts.some(
        (c) => c.id === pendingContact.id && c.reasonCode === "EXPLICIT_OPT_OUT"
      ),
      "Explicit opt-out blocks SMS eligibility with reason 'EXPLICIT_OPT_OUT'"
    );

    // ------------------------------------------------------------------------
    // 5. SUPPRESSION SEMANTICS & RE-CONSENTING SAFEGUARDS
    // ------------------------------------------------------------------------
    console.log("\n--- 5. Channel Suppression Semantics & Active Suppression Safeguards ---");

    // Create an opted-in contact
    const contactSuppTest = await contactsService.createContact(ws1Id, {
      email: "email.bounce.user@example.com",
      firstName: "Bob",
      lastName: "Taylor",
      phone: "+1 415 555 7788",
      smsConsent: "OPTED_IN",
    });

    // Case A: Add email hard bounce suppression (email deliverability)
    await suppressionService.addSuppression(ws1Id, {
      email: "email.bounce.user@example.com",
      reason: "HARD_BOUNCE",
      source: "BOUNCE",
      notes: "SMTP 550 Mailbox not found",
    });

    // Check suppression semantics: email hard bounce must NOT suppress SMS
    const smsSuppCheck = await suppressionService.isSmsSuppressed(ws1Id, {
      email: "email.bounce.user@example.com",
      phoneNormalized: "+14155557788",
    });
    assert(smsSuppCheck.isSuppressed === false, "Email HARD_BOUNCE does not suppress SMS");

    const audCheckBounce = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "ALL",
    });
    assert(
      audCheckBounce.eligibleContacts.some((c) => c.id === contactSuppTest.id),
      "Recipient with email hard bounce remains ELIGIBLE for SMS"
    );

    // Case B: Global DO_NOT_CONTACT or MANUAL_BLOCK suppression
    const contactDoNotContact = await contactsService.createContact(ws1Id, {
      email: "donotcontact.user@example.com",
      phone: "+1 415 555 9900",
      smsConsent: "OPTED_IN",
    });

    await suppressionService.addSuppression(ws1Id, {
      email: "donotcontact.user@example.com",
      reason: "DO_NOT_CONTACT",
      source: "MANUAL",
      notes: "Customer requested global do not contact across all channels",
    });

    const dncSuppCheck = await suppressionService.isSmsSuppressed(ws1Id, {
      email: "donotcontact.user@example.com",
      phoneNormalized: "+14155559900",
    });
    assert(dncSuppCheck.isSuppressed === true, "DO_NOT_CONTACT suppresses SMS channel");

    const audCheckDnc = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "ALL",
    });
    assert(
      audCheckDnc.excludedContacts.some(
        (c) => c.id === contactDoNotContact.id && c.reasonCode === "ACTIVE_SUPPRESSION"
      ),
      "Recipient with DO_NOT_CONTACT is EXCLUDED with 'ACTIVE_SUPPRESSION'"
    );

    // Case C: Re-consenting safeguard (Requirement 4)
    // Re-consenting must NOT silently override an active suppression!
    await contactsService.updateContactSmsConsent(ws1Id, contactDoNotContact.id, {
      consent: "OPTED_IN",
      source: "WEB_FORM",
      notes: "Attempted web opt-in form submission while actively suppressed",
    });

    const audCheckReconsent = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "ALL",
    });
    assert(
      audCheckReconsent.excludedContacts.some(
        (c) => c.id === contactDoNotContact.id && c.reasonCode === "ACTIVE_SUPPRESSION"
      ),
      "Re-consenting does NOT bypass active suppression; recipient remains EXCLUDED"
    );

    // ------------------------------------------------------------------------
    // 6. LIST ISOLATION & TENANT BOUNDARIES
    // ------------------------------------------------------------------------
    console.log("\n--- 6. List Scoping & Tenant Isolation ---");

    // Create a list in Workspace 1
    const listA = await prisma.contactList.create({
      data: {
        workspaceId: ws1Id,
        name: "VIP SMS Club",
      },
    });

    // Create another list in Workspace 1
    const listB = await prisma.contactList.create({
      data: {
        workspaceId: ws1Id,
        name: "Newsletter Subscribers",
      },
    });

    // Add contactUk to listA only
    await prisma.contactListMembership.create({
      data: {
        contactId: contactUk.id,
        listId: listA.id,
      },
    });

    const audListA = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "LIST",
      listId: listA.id,
    });
    assert(audListA.totalSelected === 1, "List A contains exactly 1 contact");
    assert(audListA.eligibleContacts.some((c) => c.id === contactUk.id), "List A includes contactUk");

    const audListB = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "LIST",
      listId: listB.id,
    });
    assert(audListB.totalSelected === 0, "List B contains 0 contacts");
    assert(audListB.eligibleContacts.length === 0, "List B has 0 eligible contacts");

    // Cross-workspace list isolation: Workspace 2 cannot query Workspace 1 list
    let crossListError = false;
    try {
      await smsCampaignService.calculateAudienceEligibility(ws2Id, {
        audienceType: "LIST",
        listId: listA.id,
      });
    } catch (err: any) {
      if (err.message.includes("not found") || err.message.includes("access denied")) {
        crossListError = true;
      }
    }
    assert(crossListError, "Workspace 2 query to Workspace 1 list is rejected with access denied");

    // ------------------------------------------------------------------------
    // 7. DIRECT-TEST RECIPIENT VALIDATION & SAFEGUARDS
    // ------------------------------------------------------------------------
    console.log("\n--- 7. Direct-Test Recipient Workflow & Safeguards ---");

    // Direct test with invalid number
    const testInvalid = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "TEST",
      testPhone: "12345",
    });
    assert(testInvalid.eligibleCount === 0, "Invalid test phone has 0 eligible recipients");
    assert(testInvalid.exclusionBreakdown.invalidPhone === 1, "Invalid test phone counted in invalidPhone breakdown");
    assert(testInvalid.excludedContacts[0].reasonCode === "INVALID_PHONE", "Reason code is INVALID_PHONE");

    // Direct test with opted-out contact number
    const testOptedOut = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "TEST",
      testPhone: "+1 415 555 2671", // Number of optedOutContact
    });
    assert(testOptedOut.eligibleCount === 0, "Opted-out test recipient has 0 eligible recipients");
    assert(testOptedOut.exclusionBreakdown.explicitOptOut === 1, "Test mode does NOT bypass explicit opt-out");
    assert(testOptedOut.excludedContacts[0].reasonCode === "EXPLICIT_OPT_OUT", "Reason is EXPLICIT_OPT_OUT");

    // Direct test with actively suppressed number
    const testSuppressed = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "TEST",
      testPhone: "+1 415 555 9900", // Number of contactDoNotContact
    });
    assert(testSuppressed.eligibleCount === 0, "Suppressed test phone has 0 eligible recipients");
    assert(testSuppressed.exclusionBreakdown.activeSuppression === 1, "Test mode does NOT bypass active suppression");
    assert(testSuppressed.excludedContacts[0].reasonCode === "ACTIVE_SUPPRESSION", "Reason is ACTIVE_SUPPRESSION");

    // Direct test with valid opted-in contact number
    const testValid = await smsCampaignService.calculateAudienceEligibility(ws1Id, {
      audienceType: "TEST",
      testPhone: "+44 7400 123456", // contactUk is OPTED_IN
      messageText: "Test alert to team member",
    });
    assert(testValid.eligibleCount === 1, "Valid opted-in test recipient is ELIGIBLE");
    assert(testValid.estimates.estimatedRecipients === 1, "Estimates calculated only for eligible recipients");
    assert(testValid.estimates.isEstimate === true, "Estimates explicitly marked isEstimate: true");

    // ------------------------------------------------------------------------
    // 8. API ROUTE SECURITY & UNAUTHENTICATED ACCESS
    // ------------------------------------------------------------------------
    console.log("\n--- 8. API Security Guard & Unauthenticated Access ---");

    const unauthReq = new NextRequest("http://localhost:3000/api/dashboard/sms-rcs/campaigns/audience", {
      method: "POST",
      body: JSON.stringify({ audienceType: "ALL" }),
      headers: { "Content-Type": "application/json" },
    });

    const unauthRes = await audienceRouteHandler(unauthReq);
    assert(unauthRes.status === 401, "Audience API endpoint returns 401 Unauthorized for unauthenticated request");
    const unauthJson = await unauthRes.json();
    assert(unauthJson.success === false, "API response success is false");
    assert(unauthJson.error === "Unauthorized", "API explicitly reports Unauthorized");
  } finally {
    // Clean up audit fixtures
    try {
      await prisma.workspace.delete({ where: { id: ws1Id } });
      await prisma.workspace.delete({ where: { id: ws2Id } });
    } catch {
      // Ignore cleanup error
    }
  }

  console.log("\n========================================================");
  console.log(`   COMPLIANCE AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSmsAudienceComplianceAudit().catch((err) => {
  console.error("Unhandled audit failure:", err);
  process.exit(1);
});
