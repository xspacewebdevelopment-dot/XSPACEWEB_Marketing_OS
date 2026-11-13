/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../src/lib/prisma";
import { smsReportService, SmsReportDateRange } from "../src/lib/services/sms-reports";
import { GET as getReportsRoute } from "../src/app/api/dashboard/sms-rcs/reports/route";
import { NextRequest } from "next/server";

async function runSmsReportsAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH SMS & RCS REPORTS - SYSTEM AUDIT           ");
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
    data: { name: `Reports Audit WS1 - ${Date.now()}` },
  });

  const ws2 = await (prisma as any).workspace.create({
    data: { name: `Reports Audit WS2 - ${Date.now()}` },
  });

  const ws1Id = ws1.id;
  const ws2Id = ws2.id;

  try {
    // ------------------------------------------------------------------------
    // 1. EMPTY WORKSPACE REPORTS HANDLING
    // ------------------------------------------------------------------------
    console.log("--- 1. Empty Workspace Handling & Initial State ---");

    const emptyReport = await smsReportService.getWorkspaceReports(ws2Id, "30d");
    assert(emptyReport.workspaceId === ws2Id, "Scoping matches workspace ID");
    assert(emptyReport.summary.totalCampaigns === 0, "Empty workspace has 0 total campaigns");
    assert(emptyReport.summary.draftsCount === 0, "Empty workspace has 0 drafts");
    assert(emptyReport.summary.scheduledCount === 0, "Empty workspace has 0 scheduled");
    assert(emptyReport.summary.sentCount === 0, "Empty workspace has 0 sent/dispatched");
    assert(emptyReport.summary.archivedCount === 0, "Empty workspace has 0 archived");
    assert(emptyReport.summary.smsCount === 0, "Empty workspace has 0 SMS");
    assert(emptyReport.summary.rcsCount === 0, "Empty workspace has 0 RCS");
    assert(emptyReport.summary.totalEstimatedRecipients === 0, "Total estimated recipients is 0 (no NaN)");
    assert(emptyReport.summary.totalEstimatedSegments === 0, "Total estimated segments is 0 (no NaN)");
    assert(emptyReport.summary.avgEstimatedRecipientsPerCampaign === 0, "Avg estimated recipients is 0 (no division by zero)");
    assert(emptyReport.channels.sms.percentage === 0, "SMS percentage is 0");
    assert(emptyReport.channels.rcs.percentage === 0, "RCS percentage is 0");
    assert(emptyReport.templates.total === 0, "Empty templates count is 0");
    assert(emptyReport.recentCampaigns.length === 0, "Recent campaigns list is empty array");
    assert(emptyReport.carrierDeliveryLogs.isAvailable === false, "Carrier delivery logs honestly set to false");
    assert(emptyReport.carrierDeliveryLogs.records.length === 0, "Carrier delivery records array is empty");

    // ------------------------------------------------------------------------
    // 2. SEED WORKSPACE 1 WITH MULTI-RANGE TEST FIXTURES
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Seeding Test Broadcasts with Distinct Dates & Encodings ---");

    const now = Date.now();
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000);
    const fortyFiveDaysAgo = new Date(now - 45 * 24 * 60 * 60 * 1000);
    const oneHundredDaysAgo = new Date(now - 100 * 24 * 60 * 60 * 1000);

    // Broadcast 1: 2 days ago, SMS, DRAFT, GSM-7, 100 recipients, 100 segments
    const b1 = await (prisma as any).smsBroadcast.create({
      data: {
        workspaceId: ws1Id,
        name: "Flash Sale Alert",
        protocol: "SMS",
        status: "DRAFT",
        senderId: "SALE20",
        messageText: "Save 20% today only!",
        encoding: "GSM-7",
        characterCount: 22,
        segments: 1,
        totalRecipients: 100,
        totalSegments: 100,
        createdAt: twoDaysAgo,
      },
    });

    // Broadcast 2: 15 days ago, RCS, SENT, UCS-2 (emojis), 250 recipients, 500 segments
    const b2 = await (prisma as any).smsBroadcast.create({
      data: {
        workspaceId: ws1Id,
        name: "VIP Early Access ✨",
        protocol: "RCS",
        status: "SENT",
        senderId: "VIPACCESS",
        messageText: "Exclusive preview for our top members ✨🎉",
        encoding: "UCS-2",
        characterCount: 45,
        segments: 2,
        totalRecipients: 250,
        totalSegments: 500,
        createdAt: fifteenDaysAgo,
      },
    });

    // Broadcast 3: 45 days ago, SMS, SCHEDULED, unusual/unexpected encoding null/empty, 50 recipients, 50 segments
    const b3 = await (prisma as any).smsBroadcast.create({
      data: {
        workspaceId: ws1Id,
        name: "Quarterly Scheduled Notification",
        protocol: "SMS",
        status: "SCHEDULED",
        senderId: "NOTIFY",
        messageText: "Quarterly maintenance scheduled.",
        encoding: "UNKNOWN-ENCODING",
        characterCount: 32,
        segments: 1,
        totalRecipients: 50,
        totalSegments: 50,
        createdAt: fortyFiveDaysAgo,
      },
    });

    // Broadcast 4: 100 days ago, RCS, ARCHIVED, GSM-7, 600 recipients, 600 segments
    const b4 = await (prisma as any).smsBroadcast.create({
      data: {
        workspaceId: ws1Id,
        name: "Past Autumn Campaign",
        protocol: "RCS",
        status: "ARCHIVED",
        senderId: "AUTUMN",
        messageText: "Autumn specials available now.",
        encoding: "GSM-7",
        characterCount: 30,
        segments: 1,
        totalRecipients: 600,
        totalSegments: 600,
        createdAt: oneHundredDaysAgo,
      },
    });

    // Workspace 1 Templates: 1 SMS, 1 RCS
    const t1 = await (prisma as any).smsTemplate.create({
      data: {
        workspaceId: ws1Id,
        name: "Security OTP Verification",
        protocol: "SMS",
        category: "TRANSACTIONAL",
        messageText: "Your OTP is {{otp}}.",
      },
    });

    const t2 = await (prisma as any).smsTemplate.create({
      data: {
        workspaceId: ws1Id,
        name: "Product Drop Rich Card",
        protocol: "RCS",
        category: "PROMOTIONAL",
        messageText: "Check out our latest release.",
        rcsCardTitle: "New Product Available",
      },
    });

    assert(Boolean(b1.id && b2.id && b3.id && b4.id), "4 distinct timestamped broadcasts created");
    assert(Boolean(t1.id && t2.id), "2 templates created for workspace 1");

    // ------------------------------------------------------------------------
    // 3. DATE RANGE FILTERING VERIFICATION
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Date Range Boundary & Window Testing ---");

    // Range: 7d (should include only b1: 2 days ago)
    const report7d = await smsReportService.getWorkspaceReports(ws1Id, "7d");
    assert(report7d.range === "7d", "Report returned range 7d");
    assert(report7d.summary.totalCampaigns === 1, "7d range captured exactly 1 broadcast (2 days ago)", `Count: ${report7d.summary.totalCampaigns}`);
    assert(report7d.summary.draftsCount === 1, "7d captured 1 draft");
    assert(report7d.summary.totalEstimatedRecipients === 100, "7d estimated recipients is 100");
    assert(report7d.summary.totalEstimatedSegments === 100, "7d estimated segments is 100");

    // Range: 30d (should include b1: 2d and b2: 15d)
    const report30d = await smsReportService.getWorkspaceReports(ws1Id, "30d");
    assert(report30d.range === "30d", "Report returned range 30d");
    assert(report30d.summary.totalCampaigns === 2, "30d range captured exactly 2 broadcasts", `Count: ${report30d.summary.totalCampaigns}`);
    assert(report30d.summary.draftsCount === 1, "30d captured 1 draft (b1)");
    assert(report30d.summary.sentCount === 1, "30d captured 1 dispatched/sent (b2)");
    assert(report30d.summary.smsCount === 1, "30d captured 1 SMS (b1)");
    assert(report30d.summary.rcsCount === 1, "30d captured 1 RCS (b2)");
    assert(report30d.summary.totalEstimatedRecipients === 350, "30d estimated recipients sum: 100 + 250 = 350");
    assert(report30d.summary.totalEstimatedSegments === 600, "30d estimated segments sum: 100 + 500 = 600");
    assert(report30d.summary.avgEstimatedRecipientsPerCampaign === 175, "30d avg recipients per campaign: 350 / 2 = 175");
    assert(report30d.channels.sms.percentage === 50, "SMS percentage is 50%");
    assert(report30d.channels.rcs.percentage === 50, "RCS percentage is 50%");

    // Range: 90d (should include b1: 2d, b2: 15d, b3: 45d)
    const report90d = await smsReportService.getWorkspaceReports(ws1Id, "90d");
    assert(report90d.summary.totalCampaigns === 3, "90d range captured exactly 3 broadcasts", `Count: ${report90d.summary.totalCampaigns}`);
    assert(report90d.summary.scheduledCount === 1, "90d captured 1 scheduled (b3)");
    assert(report90d.summary.totalEstimatedRecipients === 400, "90d estimated recipients: 100 + 250 + 50 = 400");
    assert(report90d.summary.totalEstimatedSegments === 650, "90d estimated segments: 100 + 500 + 50 = 650");

    // Range: all (should include all 4: b1, b2, b3, b4)
    const reportAll = await smsReportService.getWorkspaceReports(ws1Id, "all");
    assert(reportAll.range === "all", "Report returned range 'all'");
    assert(reportAll.summary.totalCampaigns === 4, "All-time captured all 4 broadcasts", `Count: ${reportAll.summary.totalCampaigns}`);
    assert(reportAll.summary.archivedCount === 1, "All-time captured 1 archived");
    assert(reportAll.summary.totalEstimatedRecipients === 1000, "All-time recipients: 100 + 250 + 50 + 600 = 1000");
    assert(reportAll.summary.totalEstimatedSegments === 1250, "All-time segments: 100 + 500 + 50 + 600 = 1250");
    assert(reportAll.summary.avgEstimatedRecipientsPerCampaign === 250, "All-time avg recipients: 1000 / 4 = 250");

    // ------------------------------------------------------------------------
    // 4. ENCODING TOLERANCE & UNEXPECTED VALUES
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Encoding Breakdown & Tolerance ---");

    // reportAll has: b1 (GSM-7), b2 (UCS-2), b3 ("UNKNOWN-ENCODING"), b4 (GSM-7)
    assert(reportAll.encoding.gsm7 === 2, "GSM-7 counted correctly (2 campaigns)");
    assert(reportAll.encoding.ucs2 === 1, "UCS-2 counted correctly (1 campaign)");
    assert(reportAll.encoding.other === 1, "Unexpected encoding safely isolated into other (1 campaign)");

    // ------------------------------------------------------------------------
    // 5. TEMPLATE INVENTORY AGGREGATION
    // ------------------------------------------------------------------------
    console.log("\n--- 5. Template Inventory Metrics ---");

    assert(reportAll.templates.total === 2, "Total templates in workspace is 2");
    assert(reportAll.templates.smsCount === 1, "SMS templates count is 1");
    assert(reportAll.templates.rcsCount === 1, "RCS templates count is 1");
    assert(reportAll.templates.categoryBreakdown["TRANSACTIONAL"] === 1, "Transactional category breakdown is 1");
    assert(reportAll.templates.categoryBreakdown["PROMOTIONAL"] === 1, "Promotional category breakdown is 1");

    // ------------------------------------------------------------------------
    // 6. INVALID PARAMETER FALLBACK HANDLING
    // ------------------------------------------------------------------------
    console.log("\n--- 6. Parameter Robustness & Fallback ---");

    const reportInvalidParam = await smsReportService.getWorkspaceReports(ws1Id, "non-existent-range" as any);
    assert(reportInvalidParam.range === "30d", "Invalid range parameter safely fell back to default '30d'");
    assert(reportInvalidParam.summary.totalCampaigns === 2, "Fallback to 30d correctly computed 2 campaigns");

    // ------------------------------------------------------------------------
    // 7. STRICT WORKSPACE ISOLATION VERIFICATION
    // ------------------------------------------------------------------------
    console.log("\n--- 7. Workspace Isolation Testing ---");

    const reportWs2 = await smsReportService.getWorkspaceReports(ws2Id, "all");
    assert(reportWs2.summary.totalCampaigns === 0, "Workspace 2 cannot see Workspace 1's campaigns (0 found)");
    assert(reportWs2.summary.totalEstimatedRecipients === 0, "Workspace 2 estimated recipients is 0");
    assert(reportWs2.templates.total === 0, "Workspace 2 cannot see Workspace 1's templates (0 found)");

    // Attempting query without workspace ID throws
    let errorThrown = false;
    try {
      await smsReportService.getWorkspaceReports("");
    } catch {
      errorThrown = true;
    }
    assert(errorThrown, "Calling getWorkspaceReports with empty workspaceId throws required error");

    // ------------------------------------------------------------------------
    // 8. UNAUTHENTICATED API ROUTE SECURITY
    // ------------------------------------------------------------------------
    console.log("\n--- 8. API Route Authentication Security ---");

    const unauthReq = new NextRequest("http://localhost:3000/api/dashboard/sms-rcs/reports?range=30d");
    const routeRes = await getReportsRoute(unauthReq);
    assert(routeRes.status === 401, "API returns 401 Unauthorized when unauthenticated cookie is absent");
    const routeBody = await routeRes.json();
    assert(routeBody.success === false, "Response success flag is false");
    assert(routeBody.error === "Unauthorized", "Response explicitly reports Unauthorized");

    // ------------------------------------------------------------------------
    // 9. CLEANUP TEST DATA
    // ------------------------------------------------------------------------
    console.log("\n--- 9. Cleaning Up Test Artifacts ---");

    await (prisma as any).smsBroadcast.deleteMany({
      where: { workspaceId: { in: [ws1Id, ws2Id] } },
    });
    await (prisma as any).smsTemplate.deleteMany({
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

runSmsReportsAudit();
