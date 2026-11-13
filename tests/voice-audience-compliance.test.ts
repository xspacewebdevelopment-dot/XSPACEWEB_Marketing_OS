/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { voiceCampaignService } from "../src/lib/services/voice-campaigns";
import { parseAndNormalizePhoneNumber } from "../src/lib/sms/phone";

async function runVoiceAudienceComplianceAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH VOICE AUDIENCE & CONSENT COMPLIANCE AUDIT  ");
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

  // Setup isolated test workspace
  const ws = await prisma.workspace.create({
    data: { name: `Voice Compliance WS - ${Date.now()}` },
  });
  const wsId = ws.id;

  try {
    // ------------------------------------------------------------------------
    // 1. INTERNATIONAL PHONE NUMBER NORMALIZATION
    // ------------------------------------------------------------------------
    console.log("--- 1. International Phone Normalization (libphonenumber-js) ---");

    const numbers = [
      { raw: "+1 (415) 555-2671", expected: "+14155552671", country: "US" },
      { raw: "+44 7400 123456", expected: "+447400123456", country: "GB" },
      { raw: "+91 98765 43210", expected: "+919876543210", country: "IN" },
      { raw: "+33 6 12 34 56 78", expected: "+33612345678", country: "FR" },
      { raw: "+49 151 23456789", expected: "+4915123456789", country: "DE" },
    ];

    for (const num of numbers) {
      const parsed = parseAndNormalizePhoneNumber(num.raw);
      assert(parsed.isValid === true, `Parsed valid international number for ${num.country}`);
      assert(parsed.e164 === num.expected, `Normalized E.164 for ${num.country} matches ${num.expected}`);
      assert(parsed.country === num.country, `ISO country code matches ${num.country}`);
    }

    // ------------------------------------------------------------------------
    // 2. SEPARATION OF VOICE CONSENT FROM SMS CONSENT
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Strict Separation: SMS Consent DOES NOT Authorize Voice Calls ---");

    // Contact A: Has SMS OPTED_IN, but Voice is PENDING -> MUST BE EXCLUDED
    await prisma.contact.create({
      data: {
        workspaceId: wsId,
        email: "sms.only@example.com",
        normalizedEmail: "sms.only@example.com",
        firstName: "Bob",
        phone: "+14155551111",
        phoneNormalized: "+14155551111",
        smsConsent: "OPTED_IN",
        voiceConsent: "PENDING", // Not authorized for voice!
      },
    });

    // Contact B: Has SMS OPTED_IN, but Voice is OPTED_OUT -> MUST BE EXCLUDED
    await prisma.contact.create({
      data: {
        workspaceId: wsId,
        email: "voice.optout@example.com",
        normalizedEmail: "voice.optout@example.com",
        firstName: "Charlie",
        phone: "+14155552222",
        phoneNormalized: "+14155552222",
        smsConsent: "OPTED_IN",
        voiceConsent: "OPTED_OUT",
      },
    });

    // Contact C: Voice is explicitly OPTED_IN (even if SMS is PENDING) -> MUST BE ELIGIBLE
    await prisma.contact.create({
      data: {
        workspaceId: wsId,
        email: "voice.authorized@example.com",
        normalizedEmail: "voice.authorized@example.com",
        firstName: "David",
        phone: "+14155553333",
        phoneNormalized: "+14155553333",
        smsConsent: "PENDING",
        voiceConsent: "OPTED_IN",
      },
    });

    // Contact D: Both SMS and Voice are OPTED_IN -> MUST BE ELIGIBLE
    await prisma.contact.create({
      data: {
        workspaceId: wsId,
        email: "both.authorized@example.com",
        normalizedEmail: "both.authorized@example.com",
        firstName: "Emma",
        phone: "+14155554444",
        phoneNormalized: "+14155554444",
        smsConsent: "OPTED_IN",
        voiceConsent: "OPTED_IN",
      },
    });

    const eligibility1 = await voiceCampaignService.calculateAudienceEligibility(wsId, {
      audienceType: "ALL",
      scriptText: "Hello from NexaReach Voice.",
    });

    assert(eligibility1.totalSelected === 4, "Total selected contacts is 4");
    assert(eligibility1.eligibleCount === 2, "Exactly 2 contacts are eligible for voice calling");
    assert(eligibility1.excludedCount === 2, "Exactly 2 contacts are excluded");
    assert(
      eligibility1.exclusionBreakdown.consentPending === 1,
      "SMS opt-in with pending voice consent is excluded under 'consentPending' reason"
    );
    assert(
      eligibility1.exclusionBreakdown.explicitOptOut === 1,
      "Explicit voice opt-out contact is excluded under 'explicitOptOut' reason"
    );

    // ------------------------------------------------------------------------
    // 3. CHANNEL SUPPRESSION SEMANTICS
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Channel Suppression Enforcement ---");

    // Suppress Emma's phone on VOICE channel
    await prisma.suppressionEntry.create({
      data: {
        workspaceId: wsId,
        normalizedEmail: "both.authorized@example.com",
        normalizedPhone: "+14155554444",
        channel: "VOICE",
        reason: "DO_NOT_CALL_REQUEST",
        status: "ACTIVE",
      },
    });

    const eligibility2 = await voiceCampaignService.calculateAudienceEligibility(wsId, {
      audienceType: "ALL",
      scriptText: "Hello from NexaReach Voice.",
    });

    assert(eligibility2.eligibleCount === 1, "Eligible count reduced from 2 to 1 after voice suppression");
    assert(
      eligibility2.exclusionBreakdown.activeSuppression === 1,
      "Voice-suppressed contact excluded with 'activeSuppression' reason"
    );

    // Add suppression for David on EMAIL channel only -> Should NOT suppress voice call!
    await prisma.suppressionEntry.create({
      data: {
        workspaceId: wsId,
        normalizedEmail: "voice.authorized@example.com",
        channel: "EMAIL",
        reason: "EMAIL_BOUNCE",
        status: "ACTIVE",
      },
    });

    const eligibility3 = await voiceCampaignService.calculateAudienceEligibility(wsId, {
      audienceType: "ALL",
      scriptText: "Hello from NexaReach Voice.",
    });

    assert(
      eligibility3.eligibleCount === 1,
      "Email-only suppression does NOT block voice outreach for voice-consented contact"
    );

    // ------------------------------------------------------------------------
    // 4. INVALID & MISSING PHONE NUMBERS
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Missing & Malformed Phone Handling ---");

    // Contact with no phone
    await prisma.contact.create({
      data: {
        workspaceId: wsId,
        email: "no.phone@example.com",
        normalizedEmail: "no.phone@example.com",
        voiceConsent: "OPTED_IN",
      },
    });

    // Contact with invalid phone format
    await prisma.contact.create({
      data: {
        workspaceId: wsId,
        email: "bad.phone@example.com",
        normalizedEmail: "bad.phone@example.com",
        phone: "12345",
        phoneNormalized: "12345",
        voiceConsent: "OPTED_IN",
      },
    });

    const eligibility4 = await voiceCampaignService.calculateAudienceEligibility(wsId, {
      audienceType: "ALL",
      scriptText: "Hello from NexaReach Voice.",
    });

    assert(
      eligibility4.exclusionBreakdown.missingPhone >= 1,
      "Contact without phone number excluded with 'missingPhone'"
    );
    assert(
      eligibility4.exclusionBreakdown.invalidPhone >= 1,
      "Malformed non-E.164 phone string excluded with 'invalidPhone'"
    );

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

runVoiceAudienceComplianceAudit().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
