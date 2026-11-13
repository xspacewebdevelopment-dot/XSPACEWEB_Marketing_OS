/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { prisma } from "../src/lib/prisma";
import { voiceTemplatesService } from "../src/lib/services/voice-templates";
import { voiceCampaignService } from "../src/lib/services/voice-campaigns";

async function runVoiceTemplatesAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH VOICE TEMPLATES & SCRIPT SYNTHESIS AUDIT   ");
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

  // Setup isolated workspaces
  const ws1 = await prisma.workspace.create({
    data: { name: `Voice Templates WS1 - ${Date.now()}` },
  });
  const ws2 = await prisma.workspace.create({
    data: { name: `Voice Templates WS2 - ${Date.now()}` },
  });

  const ws1Id = ws1.id;
  const ws2Id = ws2.id;

  try {
    // ------------------------------------------------------------------------
    // 1. TEMPLATE CREATION & WORKSPACE ISOLATION
    // ------------------------------------------------------------------------
    console.log("--- 1. Template Creation & Multi-Tenant Scoping ---");

    const tpl = await voiceTemplatesService.createTemplate(ws1Id, undefined, {
      name: "Standard Clinical Appointment Reminder",
      description: "Voice message notifying patient of doctor checkup",
      category: "REMINDER",
      scriptText: "Hello {{firstName}}, Dr. Watson is looking forward to seeing you at your appointment.",
      language: "en-US",
      voiceId: "alloy",
      speed: 1.0,
      tags: ["medical", "clinic"],
    });

    assert(Boolean(tpl.id), "Voice template created with ID", `ID: ${tpl.id}`);
    assert(tpl.category === "REMINDER", "Template category stored as REMINDER");
    assert(tpl.voiceId === "alloy", "Voice character stored as alloy");

    // Cross-workspace list test
    const ws2List = await voiceTemplatesService.listTemplates(ws2Id);
    assert(ws2List.templates.length === 0, "Workspace 2 cannot see Workspace 1 templates");

    const crossGet = await voiceTemplatesService.getTemplateById(tpl.id, ws2Id);
    assert(crossGet === null, "Cross-workspace getTemplateById returns null");

    // ------------------------------------------------------------------------
    // 2. TEMPLATE SEEDER (STARTER PRESETS)
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Curated Starter Presets Seeder ---");

    const seedRes = await voiceTemplatesService.seedStarterTemplates(ws1Id);
    assert(seedRes.success === true, "Starter templates seeded successfully");
    assert(seedRes.count === 5, "Exactly 5 curated starter presets added");

    const listAll = await voiceTemplatesService.listTemplates(ws1Id);
    assert(listAll.pagination.total === 6, "Total templates is 6 (1 custom + 5 starters)");

    // Filter by category
    const reminders = await voiceTemplatesService.listTemplates(ws1Id, { category: "REMINDER" });
    assert(reminders.templates.length >= 2, "Filtering by REMINDER returns matching templates");
    assert(reminders.templates.every((t: any) => t.category === "REMINDER"), "All returned items belong to REMINDER category");

    // ------------------------------------------------------------------------
    // 3. SCRIPT DYNAMIC VARIABLE INTERPOLATION
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Dynamic Placeholder Variable Synthesis ---");

    const sampleContact = {
      firstName: "Samantha",
      lastName: "Miller",
      name: "Samantha Miller",
      company: "CloudScale Inc",
      city: "San Francisco",
      phone: "+14155552671",
      customFields: {
        orderId: "ORD-98214",
      },
    };

    const script = "Hi {{firstName}}, this is a call from {{company}} in {{city}} regarding order {{orderId}}.";
    const rendered = voiceCampaignService.renderVoiceScript(script, sampleContact);

    assert(
      rendered.rendered === "Hi Samantha, this is a call from CloudScale Inc in San Francisco regarding order ORD-98214.",
      "All dynamic variables (firstName, company, city, customFields) correctly interpolated"
    );
    assert(rendered.missingPlaceholders.length === 0, "No missing placeholders detected");

    // Test with missing placeholder
    const brokenScript = "Hi {{firstName}}, your flight {{flightNumber}} is delayed.";
    const brokenRendered = voiceCampaignService.renderVoiceScript(brokenScript, sampleContact);

    assert(
      brokenRendered.missingPlaceholders.includes("{{flightNumber}}"),
      "Unmapped variable {{flightNumber}} detected and returned in missingPlaceholders list"
    );

    // ------------------------------------------------------------------------
    // 4. TEMPLATE UPDATE & DELETE
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Template Update & Deletion ---");

    const updated = await voiceTemplatesService.updateTemplate(tpl.id, ws1Id, {
      name: "Standard Clinical Appointment Reminder - V2",
      speed: 1.1,
    });
    assert(updated.name.includes("V2"), "Template name updated successfully");
    assert(updated.speed === 1.1, "Template speed updated to 1.1");

    const deleteRes = await voiceTemplatesService.deleteTemplate(tpl.id, ws1Id);
    assert(deleteRes.success === true, "Template deleted successfully");

    const verifyDeleted = await voiceTemplatesService.getTemplateById(tpl.id, ws1Id);
    assert(verifyDeleted === null, "Deleted template absent from database");

  } finally {
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

runVoiceTemplatesAudit().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
