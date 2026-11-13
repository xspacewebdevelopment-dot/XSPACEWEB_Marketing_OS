/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../src/lib/prisma";
import {
  smsSettingsService,
  isValidIanaTimezone,
  validatePreferredSenderId,
  isValidHexColor,
} from "../src/lib/services/sms-settings";
import { GET as getSettingsRoute, PUT as putSettingsRoute } from "../src/app/api/dashboard/sms-rcs/settings/route";
import { calculateSmsEncoding } from "../src/lib/sms/gsm";
import { NextRequest } from "next/server";

async function runSmsSettingsAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH SMS & RCS SETTINGS - SYSTEM AUDIT          ");
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

  // Create isolated test workspaces
  const ws1 = await (prisma as any).workspace.create({
    data: { name: `Settings Audit WS1 - ${Date.now()}` },
  });

  const ws2 = await (prisma as any).workspace.create({
    data: { name: `Settings Audit WS2 - ${Date.now()}` },
  });

  const ws1Id = ws1.id;
  const ws2Id = ws2.id;

  try {
    // ------------------------------------------------------------------------
    // 1. DEFAULT INITIALIZATION ON FRESH WORKSPACE
    // ------------------------------------------------------------------------
    console.log("--- 1. Default Workspace Settings Initialization ---");

    const defaultSettings = await smsSettingsService.getSettings(ws1Id);
    assert(defaultSettings.workspaceId === ws1Id, "Settings strictly scoped to workspace 1");
    assert(defaultSettings.defaultSenderId === "NEXAREACH", "Default preferred sender ID is NEXAREACH");
    assert(defaultSettings.defaultChannel === "SMS", "Default channel is SMS");
    assert(defaultSettings.timezone === "UTC", "Default timezone is UTC");
    assert(defaultSettings.enforceStopOptOut === true, "Enforce STOP opt-out is enabled by default");
    assert(defaultSettings.encodingPreference === "AUTO", "Default encoding preference is AUTO");
    assert(defaultSettings.rcsBrandName === "NexaReach Marketing OS", "Default RCS brand name initialized");
    assert(defaultSettings.rcsBrandColor === "#2563EB", "Default RCS brand color is #2563EB");

    // ------------------------------------------------------------------------
    // 2. SETTINGS PERSISTENCE & UPDATES
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Updating & Persisting Settings ---");

    const updatedSettings = await smsSettingsService.updateSettings(ws1Id, {
      defaultSenderId: "ACMECO",
      defaultChannel: "RCS",
      timezone: "America/New_York",
      enforceStopOptOut: false,
      encodingPreference: "UCS-2",
      rcsBrandName: "Acme Corporation",
      rcsBrandColor: "#7C3AED",
    });

    assert(updatedSettings.defaultSenderId === "ACMECO", "Preferred Sender ID updated to ACMECO");
    assert(updatedSettings.defaultChannel === "RCS", "Default Channel updated to RCS");
    assert(updatedSettings.timezone === "America/New_York", "Timezone updated to America/New_York");
    assert(updatedSettings.enforceStopOptOut === false, "Enforce STOP opt-out updated to false");
    assert(updatedSettings.encodingPreference === "UCS-2", "Encoding preference updated to UCS-2");
    assert(updatedSettings.rcsBrandName === "Acme Corporation", "RCS brand name updated");
    assert(updatedSettings.rcsBrandColor === "#7C3AED", "RCS brand color updated");

    // Reload from database to verify persistence
    const reloadedSettings = await smsSettingsService.getSettings(ws1Id);
    assert(reloadedSettings.defaultSenderId === "ACMECO", "Persisted Sender ID reloaded from database");
    assert(reloadedSettings.defaultChannel === "RCS", "Persisted Default Channel reloaded");
    assert(reloadedSettings.timezone === "America/New_York", "Persisted Timezone reloaded");
    assert(reloadedSettings.enforceStopOptOut === false, "Persisted STOP opt-out reloaded");
    assert(reloadedSettings.encodingPreference === "UCS-2", "Persisted Encoding Preference reloaded");
    assert(reloadedSettings.rcsBrandName === "Acme Corporation", "Persisted Brand Name reloaded");
    assert(reloadedSettings.rcsBrandColor === "#7C3AED", "Persisted Brand Color reloaded");

    // ------------------------------------------------------------------------
    // 3. IANA TIMEZONE VALIDATION
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Timezone Validation ---");

    assert(isValidIanaTimezone("UTC") === true, "UTC is valid IANA timezone");
    assert(isValidIanaTimezone("America/New_York") === true, "America/New_York is valid IANA timezone");
    assert(isValidIanaTimezone("Europe/London") === true, "Europe/London is valid IANA timezone");
    assert(isValidIanaTimezone("Asia/Kolkata") === true, "Asia/Kolkata is valid IANA timezone");
    assert(isValidIanaTimezone("Fake/Timezone") === false, "Fake/Timezone is rejected as invalid");
    assert(isValidIanaTimezone("") === false, "Empty timezone string is rejected");
    assert(isValidIanaTimezone("GMT+5") === false, "Non-standard IANA string is rejected");

    let invalidTzError = false;
    try {
      await smsSettingsService.updateSettings(ws1Id, { timezone: "Mars/Olympus_Mons" });
    } catch {
      invalidTzError = true;
    }
    assert(invalidTzError, "updateSettings rejects invalid IANA timezone Mars/Olympus_Mons");

    // ------------------------------------------------------------------------
    // 4. PREFERRED SENDER ID VALIDATION & NORMALIZATION
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Preferred Sender ID Validation ---");

    const validAlpha = validatePreferredSenderId("nexareach");
    assert(validAlpha.valid === true, "Alphanumeric handle is valid");
    assert(validAlpha.normalized === "NEXAREACH", "Alphanumeric handle normalized to uppercase");

    const validShortcode = validatePreferredSenderId("12345");
    assert(validShortcode.valid === true, "Numeric short code is valid");

    const validE164 = validatePreferredSenderId("+15551234567");
    assert(validE164.valid === true, "E.164 phone format is accepted as sender ID");

    const invalidTooLong = validatePreferredSenderId("THISISWAYTOOLONGFORTHESTANDARDSENDERID");
    assert(invalidTooLong.valid === false, "Sender ID exceeding length limit is rejected");

    const invalidChars = validatePreferredSenderId("ACME $$$");
    assert(invalidChars.valid === false, "Sender ID with disallowed symbols is rejected");

    let invalidSenderError = false;
    try {
      await smsSettingsService.updateSettings(ws1Id, { defaultSenderId: "INVALID@@@NAME" });
    } catch {
      invalidSenderError = true;
    }
    assert(invalidSenderError, "updateSettings rejects invalid sender ID with symbols");

    // ------------------------------------------------------------------------
    // 5. CHANNEL, ENCODING & COLOR VALIDATION
    // ------------------------------------------------------------------------
    console.log("\n--- 5. Channel, Encoding & Brand Color Validation ---");

    let invalidChannelError = false;
    try {
      await smsSettingsService.updateSettings(ws1Id, { defaultChannel: "WHATSAPP" as any });
    } catch {
      invalidChannelError = true;
    }
    assert(invalidChannelError, "updateSettings rejects invalid channel 'WHATSAPP'");

    let invalidEncodingError = false;
    try {
      await smsSettingsService.updateSettings(ws1Id, { encodingPreference: "UTF-8" as any });
    } catch {
      invalidEncodingError = true;
    }
    assert(invalidEncodingError, "updateSettings rejects invalid encoding 'UTF-8'");

    assert(isValidHexColor("#2563EB") === true, "Standard 6-char hex color is valid");
    assert(isValidHexColor("#FFF") === true, "3-char hex color is valid");
    assert(isValidHexColor("blue") === false, "Named color 'blue' is rejected");
    assert(isValidHexColor("123456") === false, "Missing '#' is rejected");

    let invalidColorError = false;
    try {
      await smsSettingsService.updateSettings(ws1Id, { rcsBrandColor: "not-a-color" });
    } catch {
      invalidColorError = true;
    }
    assert(invalidColorError, "updateSettings rejects invalid brand color");

    // ------------------------------------------------------------------------
    // 6. ENCODING PREFERENCE BEHAVIOR WITH CALCULATOR
    // ------------------------------------------------------------------------
    console.log("\n--- 6. Encoding Preference Behavior ---");

    // Pure ASCII text
    const plainText = "Hello World! Standard text without emojis.";
    const autoCalc = calculateSmsEncoding(plainText, "AUTO");
    assert(autoCalc.encoding === "GSM-7", "AUTO preference on ASCII text produces GSM-7");
    assert(autoCalc.maxCharsPerSegment === 160, "GSM-7 single segment capacity is 160");

    const forcedUcs2 = calculateSmsEncoding(plainText, "UCS-2");
    assert(forcedUcs2.encoding === "UCS-2", "Forced UCS-2 preference produces UCS-2 even for ASCII");
    assert(forcedUcs2.maxCharsPerSegment === 70, "UCS-2 single segment capacity is 70");

    // Emoji text
    const emojiText = "Special discount alert! ✨🎉";
    const autoEmojiCalc = calculateSmsEncoding(emojiText, "AUTO");
    assert(autoEmojiCalc.encoding === "UCS-2", "AUTO preference detects emojis and escalates to UCS-2");

    // ------------------------------------------------------------------------
    // 7. WORKSPACE TENANT ISOLATION
    // ------------------------------------------------------------------------
    console.log("\n--- 7. Tenant Isolation ---");

    // Workspace 2 should have its own separate settings initialized independently
    const ws2Settings = await smsSettingsService.getSettings(ws2Id);
    assert(ws2Settings.workspaceId === ws2Id, "Workspace 2 settings scoped to WS2");
    assert(ws2Settings.defaultSenderId === "NEXAREACH", "Workspace 2 starts with untouched default NEXAREACH");
    assert(ws2Settings.timezone === "UTC", "Workspace 2 has default UTC timezone (unaffected by WS1's America/New_York)");
    assert(ws2Settings.defaultChannel === "SMS", "Workspace 2 has default SMS channel (unaffected by WS1's RCS)");

    // Empty workspaceId throws
    let emptyWsError = false;
    try {
      await smsSettingsService.getSettings("");
    } catch {
      emptyWsError = true;
    }
    assert(emptyWsError, "getSettings throws when workspaceId is missing");

    // ------------------------------------------------------------------------
    // 8. API ROUTE SECURITY & UNAUTHENTICATED REQUEST REJECTION
    // ------------------------------------------------------------------------
    console.log("\n--- 8. API Route Security ---");

    const unauthGetReq = new NextRequest("http://localhost:3000/api/dashboard/sms-rcs/settings");
    const getRes = await getSettingsRoute();
    assert(getRes.status === 401, "GET /api/dashboard/sms-rcs/settings returns 401 when unauthenticated");
    const getJson = await getRes.json();
    assert(getJson.success === false, "GET response success flag is false");
    assert(getJson.error === "Unauthorized", "GET response reports Unauthorized");

    const unauthPutReq = new NextRequest("http://localhost:3000/api/dashboard/sms-rcs/settings", {
      method: "PUT",
      body: JSON.stringify({ defaultSenderId: "HACKED" }),
    });
    const putRes = await putSettingsRoute(unauthPutReq);
    assert(putRes.status === 401, "PUT /api/dashboard/sms-rcs/settings returns 401 when unauthenticated");
    const putJson = await putRes.json();
    assert(putJson.success === false, "PUT response success flag is false");

    // ------------------------------------------------------------------------
    // 9. CLEANUP TEST DATA
    // ------------------------------------------------------------------------
    console.log("\n--- 9. Cleaning Up Test Artifacts ---");

    await (prisma as any).smsSettings.deleteMany({
      where: { workspaceId: { in: [ws1Id, ws2Id] } },
    });
    await (prisma as any).workspace.deleteMany({
      where: { id: { in: [ws1Id, ws2Id] } },
    });

    console.log("  ✅ Test workspaces and database records cleaned up cleanly.\n");

  } catch (error) {
    console.error("Test execution failed with error:", error);
    failed++;
  }

  console.log("========================================================");
  console.log(` AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSmsSettingsAudit();
