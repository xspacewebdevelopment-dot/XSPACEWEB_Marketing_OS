/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../src/lib/prisma";
import { smsTemplateService } from "../src/lib/services/sms-templates";
import { requireAuth } from "../src/lib/auth";

async function runSmsTemplatesAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH SMS & RCS TEMPLATES - SYSTEM AUDIT         ");
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

  // Setup two isolated test workspaces
  const ws1 = await prisma.workspace.create({
    data: { name: `Template Audit WS1 - ${Date.now()}` },
  });

  const ws2 = await prisma.workspace.create({
    data: { name: `Template Audit WS2 - ${Date.now()}` },
  });

  const ws1Id = ws1.id;
  const ws2Id = ws2.id;

  try {
    // ------------------------------------------------------------------------
    // 1. TEMPLATE CREATION & CHANNEL VALIDATION
    // ------------------------------------------------------------------------
    console.log("--- 1. Template Creation & Channel Types ---");

    const smsTpl = await smsTemplateService.createTemplate(ws1Id, undefined, {
      name: "Security OTP Passcode Template",
      description: "Standard OTP verification passcode for two-factor login",
      protocol: "SMS",
      category: "TRANSACTIONAL",
      messageText: "Your NexaReach code is {{otpCode}}. Valid for 10 minutes. Do not share.",
    });

    assert(Boolean(smsTpl.id), "SMS template created with valid ID", `ID: ${smsTpl.id}`);
    assert(smsTpl.protocol === "SMS", "Protocol stored as SMS");
    assert(smsTpl.category === "TRANSACTIONAL", "Internal category stored as TRANSACTIONAL");
    assert(smsTpl.messageText.includes("{{otpCode}}"), "Personalization placeholder persisted");

    const rcsTpl = await smsTemplateService.createTemplate(ws1Id, undefined, {
      name: "VIP Product Showcase Rich Card",
      description: "Interactive brand card for premium user announcements",
      protocol: "RCS",
      category: "PROMOTIONAL",
      messageText: "Unlock exclusive capabilities with NexaReach Marketing OS.",
      rcsCardTitle: "VIP Early Access Invitation",
      rcsActionLabel: "Explore Features",
      rcsActionUrl: "https://nexareach.com/vip",
      rcsMediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
    });

    assert(Boolean(rcsTpl.id), "RCS template created with valid ID", `ID: ${rcsTpl.id}`);
    assert(rcsTpl.protocol === "RCS", "Protocol stored as RCS");
    assert(rcsTpl.rcsCardTitle === "VIP Early Access Invitation", "RCS card title persisted");
    assert(rcsTpl.rcsActionLabel === "Explore Features", "RCS action CTA label persisted");
    assert(rcsTpl.rcsActionUrl === "https://nexareach.com/vip", "RCS action URL persisted");
    assert(Boolean(rcsTpl.rcsMediaUrl), "RCS media URL persisted");

    // ------------------------------------------------------------------------
    // 2. TEMPLATE RETRIEVAL (GET BY ID)
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Template Retrieval & Persistence ---");

    const fetchedSms = await smsTemplateService.getTemplateById(smsTpl.id, ws1Id);
    assert(Boolean(fetchedSms), "Fetched SMS template by ID");
    assert(fetchedSms?.name === "Security OTP Passcode Template", "Template name matches database record");
    assert(fetchedSms?.workspaceId === ws1Id, "Workspace ID correctly associated");

    const fetchedRcs = await smsTemplateService.getTemplateById(rcsTpl.id, ws1Id);
    assert(Boolean(fetchedRcs), "Fetched RCS template by ID");
    assert(fetchedRcs?.rcsCardTitle === "VIP Early Access Invitation", "RCS card title matches");

    // ------------------------------------------------------------------------
    // 3. TEMPLATE EDITING / UPDATE
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Template Update ---");

    const updated = await smsTemplateService.updateTemplate(smsTpl.id, ws1Id, {
      name: "Security OTP Passcode Template [Revised]",
      messageText: "Your NexaReach code is {{otpCode}}. Valid for 5 minutes. STOP to opt-out.",
      category: "ALERTS",
    });

    assert(updated.name === "Security OTP Passcode Template [Revised]", "Template name updated");
    assert(updated.messageText.includes("5 minutes"), "Message body updated");
    assert(updated.category === "ALERTS", "Category updated to ALERTS");

    // ------------------------------------------------------------------------
    // 4. WORKSPACE ISOLATION (CROSS-TENANT SECURITY)
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Workspace Scoping & Tenant Isolation ---");

    // Workspace 2 cannot list Workspace 1 templates
    const ws2List = await smsTemplateService.listTemplates(ws2Id);
    assert(ws2List.templates.length === 0, "Workspace 2 template list is isolated (0 templates)");
    assert(ws2List.pagination.total === 0, "Workspace 2 total count is 0");

    // Workspace 2 cannot fetch Workspace 1 template by ID
    const crossFetch = await smsTemplateService.getTemplateById(smsTpl.id, ws2Id);
    assert(crossFetch === null, "Cross-workspace getTemplateById returns null");

    // Workspace 2 cannot update Workspace 1 template
    let crossUpdateBlocked = false;
    try {
      await smsTemplateService.updateTemplate(smsTpl.id, ws2Id, {
        name: "Malicious Cross-Tenant Overwrite",
      });
    } catch {
      crossUpdateBlocked = true;
    }
    assert(crossUpdateBlocked, "Cross-workspace update is blocked with error");

    // Workspace 2 cannot delete Workspace 1 template
    let crossDeleteBlocked = false;
    try {
      await smsTemplateService.deleteTemplate(smsTpl.id, ws2Id);
    } catch {
      crossDeleteBlocked = true;
    }
    assert(crossDeleteBlocked, "Cross-workspace delete is blocked with error");

    // ------------------------------------------------------------------------
    // 5. SERVER-SIDE FILTERING, SEARCH & PAGINATION
    // ------------------------------------------------------------------------
    console.log("\n--- 5. Server-Side Filtering, Search & Pagination ---");

    // Add extra templates to test filtering and pagination
    await smsTemplateService.createTemplate(ws1Id, undefined, {
      name: "Marketing Weekend Flash Sale",
      description: "Weekend urgency discount card",
      protocol: "RCS",
      category: "MARKETING",
      messageText: "Save 40% this weekend with code {{promoCode}}.",
      rcsCardTitle: "40% Weekend Flash Sale",
    });

    await smsTemplateService.createTemplate(ws1Id, undefined, {
      name: "Appointment Booking Confirmation",
      description: "Booking alert for strategy consultations",
      protocol: "SMS",
      category: "ALERTS",
      messageText: "Hi {{firstName}}, your booking for {{time}} is confirmed.",
    });

    // Total in WS1 should be 4
    const allList = await smsTemplateService.listTemplates(ws1Id, { protocol: "ALL" });
    assert(allList.templates.length === 4, "List All returns 4 templates in workspace");
    assert(allList.counts.all === 4, "Counts.all is 4");
    assert(allList.counts.sms === 2, "Counts.sms is 2");
    assert(allList.counts.rcs === 2, "Counts.rcs is 2");

    // Filter by Channel / Protocol
    const smsOnly = await smsTemplateService.listTemplates(ws1Id, { protocol: "SMS" });
    assert(smsOnly.templates.length === 2, "Protocol SMS filter returns exactly 2 records");
    assert(smsOnly.templates.every((t: any) => t.protocol === "SMS"), "All returned records have SMS protocol");

    const rcsOnly = await smsTemplateService.listTemplates(ws1Id, { protocol: "RCS" });
    assert(rcsOnly.templates.length === 2, "Protocol RCS filter returns exactly 2 records");
    assert(rcsOnly.templates.every((t: any) => t.protocol === "RCS"), "All returned records have RCS protocol");

    // Filter by Category
    const alertsOnly = await smsTemplateService.listTemplates(ws1Id, { category: "ALERTS" });
    assert(alertsOnly.templates.length === 2, "Category ALERTS filter returns 2 records");
    assert(alertsOnly.templates.every((t: any) => t.category === "ALERTS"), "All records match ALERTS category");

    // Search by Name
    const searchByName = await smsTemplateService.listTemplates(ws1Id, { search: "Flash Sale" });
    assert(searchByName.templates.length === 1, "Search by name returns 1 matching template");
    assert(searchByName.templates[0].name.includes("Flash Sale"), "Search query matched correctly");

    // Search by Message Text
    const searchByBody = await smsTemplateService.listTemplates(ws1Id, { search: "booking" });
    assert(searchByBody.templates.length === 1, "Search by message body text matches template");

    // Validated Pagination
    const page1 = await smsTemplateService.listTemplates(ws1Id, { page: 1, limit: 2 });
    assert(page1.templates.length === 2, "Page 1 returns 2 records with limit=2");
    assert(page1.pagination.page === 1, "Pagination page is 1");
    assert(page1.pagination.limit === 2, "Pagination limit is 2");
    assert(page1.pagination.total === 4, "Pagination total is 4");
    assert(page1.pagination.totalPages === 2, "Pagination totalPages is 2");

    const page2 = await smsTemplateService.listTemplates(ws1Id, { page: 2, limit: 2 });
    assert(page2.templates.length === 2, "Page 2 returns remaining 2 records");
    assert(page2.templates[0].id !== page1.templates[0].id, "Page 2 records are distinct from Page 1");

    // ------------------------------------------------------------------------
    // 6. EXPLICIT STARTER TEMPLATES SEEDING (OPT-IN FLOW)
    // ------------------------------------------------------------------------
    console.log("\n--- 6. Explicit Opt-In Starter Templates Seeding ---");

    // Ensure Workspace 2 still has 0 templates
    const preSeedWs2 = await smsTemplateService.listTemplates(ws2Id);
    assert(preSeedWs2.templates.length === 0, "Workspace 2 starts with 0 templates (no auto-seeding)");

    // Explicit opt-in starter seed
    const seedResult = await smsTemplateService.seedStarterTemplates(ws2Id);
    assert(seedResult.success === true, "Explicit starter templates seed succeeded");
    assert(seedResult.count === 5, "Seeded 5 curated starter templates");

    const postSeedWs2 = await smsTemplateService.listTemplates(ws2Id);
    assert(postSeedWs2.templates.length === 5, "Workspace 2 now has 5 templates after opt-in seeding");

    // ------------------------------------------------------------------------
    // 7. TEMPLATE DELETION
    // ------------------------------------------------------------------------
    console.log("\n--- 7. Template Deletion ---");

    const deleteRes = await smsTemplateService.deleteTemplate(smsTpl.id, ws1Id);
    assert(deleteRes.success === true, "Template deleted successfully");
    assert(deleteRes.deletedId === smsTpl.id, "Deleted template ID returned");

    const afterDelete = await smsTemplateService.getTemplateById(smsTpl.id, ws1Id);
    assert(afterDelete === null, "Deleted template no longer exists in database");

    // ------------------------------------------------------------------------
    // 8. UNAUTHENTICATED REQUEST & AUTH GUARD VERIFICATION
    // ------------------------------------------------------------------------
    console.log("\n--- 8. Authentication Guard & Unauthenticated Requests ---");

    let unauthBlocked = false;
    try {
      await requireAuth();
    } catch {
      unauthBlocked = true;
    }
    assert(unauthBlocked, "requireAuth() strictly rejects when no authenticated session is present");

    const unauthGetReq = new Request("http://localhost/api/dashboard/sms-rcs/templates");
    const { GET: getRoute } = await import("../src/app/api/dashboard/sms-rcs/templates/route");
    const getRes = await getRoute(unauthGetReq as any);
    assert(getRes.status === 401, "GET /api/dashboard/sms-rcs/templates returns 401 for unauthenticated request");

    const unauthPostReq = new Request("http://localhost/api/dashboard/sms-rcs/templates", {
      method: "POST",
      body: JSON.stringify({ name: "Unauth Test", messageText: "Test body" }),
    });
    const { POST: postRoute } = await import("../src/app/api/dashboard/sms-rcs/templates/route");
    const postRes = await postRoute(unauthPostReq as any);
    assert(postRes.status === 401, "POST /api/dashboard/sms-rcs/templates returns 401 for unauthenticated request");
  } finally {
    // Cleanup audit test workspaces
    try {
      await prisma.workspace.delete({ where: { id: ws1Id } });
      await prisma.workspace.delete({ where: { id: ws2Id } });
    } catch {
      // Ignore cleanup error
    }
  }

  console.log("\n========================================================");
  console.log(`   AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSmsTemplatesAudit().catch((err) => {
  console.error("Unhandled template audit failure:", err);
  process.exit(1);
});
