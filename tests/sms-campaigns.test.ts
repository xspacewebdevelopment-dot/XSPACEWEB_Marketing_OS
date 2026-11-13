/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../src/lib/prisma";
import { smsCampaignService } from "../src/lib/services/sms-campaigns";

async function runSmsCampaignsAudit() {
  console.log("\n========================================================");
  console.log("   NEXAREACH SMS & RCS CAMPAIGNS - SYSTEM AUDIT         ");
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

  // 1. Setup two isolated test workspaces
  const ws1 = await prisma.workspace.create({
    data: { name: `SMS Audit Workspace 1 - ${Date.now()}` },
  });

  const ws2 = await prisma.workspace.create({
    data: { name: `SMS Audit Workspace 2 - ${Date.now()}` },
  });

  const ws1Id = ws1.id;
  const ws2Id = ws2.id;

  try {
    // ------------------------------------------------------------------------
    // 1. DRAFT CREATION & PROPERTIES
    // ------------------------------------------------------------------------
    console.log("--- 1. Broadcast Draft Creation & Property Validation ---");

    const smsDraft = await smsCampaignService.createBroadcast(ws1Id, undefined, {
      name: "Q4 SMS Flash Sale Announcement",
      protocol: "SMS",
      status: "DRAFT",
      senderId: "NEXADEAL",
      messageText: "Hi {{firstName}}, our 50% Q4 sale is live! Visit https://nexareach.com/sale Reply STOP to opt out.",
      encoding: "GSM-7",
      characterCount: 96,
      segments: 1,
      totalRecipients: 500,
      totalSegments: 500,
      audienceType: "ALL",
    });

    assert(Boolean(smsDraft.id), "SMS draft created with valid ID", `ID: ${smsDraft.id}`);
    assert(smsDraft.protocol === "SMS", "Protocol is SMS");
    assert(smsDraft.status === "DRAFT", "Status defaults to DRAFT");
    assert(smsDraft.senderId === "NEXADEAL", "Sender ID sanitized and stored");
    assert(smsDraft.totalRecipients === 500, "Recipient count stored correctly");
    assert(smsDraft.totalSegments === 500, "Estimated segments stored correctly");

    const rcsDraft = await smsCampaignService.createBroadcast(ws1Id, undefined, {
      name: "VIP Interactive Product Showcase",
      protocol: "RCS",
      status: "DRAFT",
      senderId: "NEXAREACH",
      messageText: "Explore our next-gen marketing operating system features.",
      rcsCardTitle: "Exclusive Early Access Card",
      rcsActionLabel: "View Demo",
      rcsActionUrl: "https://nexareach.com/demo",
      rcsMediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      rcsSuggestion: "Reply HELP for more info",
      encoding: "GSM-7",
      characterCount: 61,
      segments: 1,
      totalRecipients: 250,
      totalSegments: 250,
      audienceType: "LIST",
      listId: "vip-list-123",
    });

    assert(rcsDraft.protocol === "RCS", "RCS protocol draft created successfully");
    assert(rcsDraft.rcsCardTitle === "Exclusive Early Access Card", "RCS card title persisted");
    assert(rcsDraft.rcsActionLabel === "View Demo", "RCS action CTA label persisted");

    // ------------------------------------------------------------------------
    // 2. WORKSPACE ISOLATION TESTS
    // ------------------------------------------------------------------------
    console.log("\n--- 2. Workspace Scoping & Security Isolation ---");

    // Workspace 2 should NOT see Workspace 1 broadcasts
    const ws2List = await smsCampaignService.listBroadcasts(ws2Id);
    assert(ws2List.broadcasts.length === 0, "Workspace 2 list is empty (cross-workspace isolation)");
    assert(ws2List.pagination.total === 0, "Workspace 2 total count is 0");

    // Workspace 2 cannot fetch Workspace 1 draft by ID
    const crossFetch = await smsCampaignService.getBroadcastById(smsDraft.id, ws2Id);
    assert(crossFetch === null, "Cross-workspace getBroadcastById returns null");

    // Workspace 2 cannot update Workspace 1 draft
    let updateCrossFailed = false;
    try {
      await smsCampaignService.updateBroadcast(smsDraft.id, ws2Id, {
        name: "Hacked by WS2",
      });
    } catch {
      updateCrossFailed = true;
    }
    assert(updateCrossFailed, "Cross-workspace update is blocked with error");

    // Workspace 2 cannot delete Workspace 1 draft
    let deleteCrossFailed = false;
    try {
      await smsCampaignService.deleteBroadcast(smsDraft.id, ws2Id);
    } catch {
      deleteCrossFailed = true;
    }
    assert(deleteCrossFailed, "Cross-workspace delete is blocked with error");

    // ------------------------------------------------------------------------
    // 3. EDIT DRAFT (LOADING & SAVING)
    // ------------------------------------------------------------------------
    console.log("\n--- 3. Edit Draft & Load Saved Data ---");

    const updated = await smsCampaignService.updateBroadcast(smsDraft.id, ws1Id, {
      name: "Q4 SMS Flash Sale Announcement [Updated]",
      messageText: "Updated message body with new promo link.",
      totalRecipients: 750,
      totalSegments: 750,
    });

    assert(
      updated.name === "Q4 SMS Flash Sale Announcement [Updated]",
      "Draft name updated"
    );
    assert(
      updated.messageText === "Updated message body with new promo link.",
      "Draft message body updated"
    );
    assert(updated.totalRecipients === 750, "Updated recipient count persisted");

    const fetchedForComposer = await smsCampaignService.getBroadcastById(smsDraft.id, ws1Id);
    assert(Boolean(fetchedForComposer), "Fetched draft by ID for composer loading");
    assert(
      fetchedForComposer?.name === "Q4 SMS Flash Sale Announcement [Updated]",
      "Loaded draft matches saved changes"
    );

    // ------------------------------------------------------------------------
    // 4. LISTING, SEARCHING & FILTERING
    // ------------------------------------------------------------------------
    console.log("\n--- 4. Filtering, Searching & Status Counts ---");

    // Create a non-draft campaign directly in database to test statuses
    const sentBroadcast = await (prisma as any).smsBroadcast.create({
      data: {
        workspaceId: ws1Id,
        name: "Historical Transactional Alerts",
        protocol: "SMS",
        status: "SENT",
        senderId: "NEXAALERT",
        messageText: "Your one-time code is 849201.",
        totalRecipients: 120,
        totalSegments: 120,
      },
    });

    const scheduledBroadcast = await (prisma as any).smsBroadcast.create({
      data: {
        workspaceId: ws1Id,
        name: "Black Friday Early Access VIP",
        protocol: "RCS",
        status: "SCHEDULED",
        senderId: "NEXAVIP",
        messageText: "Black Friday deals unlock tomorrow.",
        totalRecipients: 400,
        totalSegments: 400,
      },
    });
    assert(Boolean(scheduledBroadcast.id), "Scheduled broadcast fixture created");

    // List all
    const allList = await smsCampaignService.listBroadcasts(ws1Id, { status: "ALL" });
    assert(allList.broadcasts.length === 4, "List All returns 4 total broadcasts");
    assert(allList.counts.all === 4, "Status counts.all is 4");
    assert(allList.counts.draft === 2, "Status counts.draft is 2");
    assert(allList.counts.sent === 1, "Status counts.sent is 1");
    assert(allList.counts.scheduled === 1, "Status counts.scheduled is 1");
    assert(allList.counts.archived === 0, "Status counts.archived is 0");

    // Filter by DRAFT
    const draftsList = await smsCampaignService.listBroadcasts(ws1Id, { status: "DRAFT" });
    assert(draftsList.broadcasts.length === 2, "Status DRAFT filter returns exactly 2 records");
    assert(draftsList.broadcasts.every((b: any) => b.status === "DRAFT"), "All returned records have DRAFT status");

    // Filter by SENT
    const sentList = await smsCampaignService.listBroadcasts(ws1Id, { status: "SENT" });
    assert(sentList.broadcasts.length === 1, "Status SENT filter returns 1 record");
    assert(sentList.broadcasts[0].name === "Historical Transactional Alerts", "SENT record matches");

    // Filter by Channel / Protocol
    const rcsList = await smsCampaignService.listBroadcasts(ws1Id, { protocol: "RCS" });
    assert(rcsList.broadcasts.length === 2, "Protocol RCS filter returns 2 records");
    assert(rcsList.broadcasts.every((b: any) => b.protocol === "RCS"), "All returned records have RCS protocol");

    const smsList = await smsCampaignService.listBroadcasts(ws1Id, { protocol: "SMS" });
    assert(smsList.broadcasts.length === 2, "Protocol SMS filter returns 2 records");

    // Search by name
    const searchByName = await smsCampaignService.listBroadcasts(ws1Id, { search: "Flash Sale" });
    assert(searchByName.broadcasts.length === 1, "Search by name finds matching broadcast");
    assert(searchByName.broadcasts[0].id === smsDraft.id, "Correct campaign returned for search");

    // Search by Sender ID
    const searchBySender = await smsCampaignService.listBroadcasts(ws1Id, { search: "NEXAVIP" });
    assert(searchBySender.broadcasts.length === 1, "Search by sender ID finds matching broadcast");

    // ------------------------------------------------------------------------
    // 5. RESTRICTIONS ON NON-DRAFT RECORDS (RULE 9)
    // ------------------------------------------------------------------------
    console.log("\n--- 5. Enforcement of Rule 9 (Only Drafts Editable/Deletable) ---");

    // Attempt to delete SENT broadcast
    let deleteSentBlocked = false;
    try {
      await smsCampaignService.deleteBroadcast(sentBroadcast.id, ws1Id);
    } catch (err: any) {
      if (err.message.includes("Only draft")) {
        deleteSentBlocked = true;
      }
    }
    assert(deleteSentBlocked, "Deleting non-draft (SENT) is blocked by service with 'Only draft campaigns can be deleted.'");

    // Attempt to edit SENT broadcast
    let updateSentBlocked = false;
    try {
      await smsCampaignService.updateBroadcast(sentBroadcast.id, ws1Id, {
        name: "Altered Sent Name",
      });
    } catch (err: any) {
      if (err.message.includes("Only draft")) {
        updateSentBlocked = true;
      }
    }
    assert(updateSentBlocked, "Updating non-draft (SENT) is blocked by service with 'Only draft campaigns can be edited.'");

    // ------------------------------------------------------------------------
    // 6. DELETE DRAFT WITH CONFIRMATION LIFECYCLE
    // ------------------------------------------------------------------------
    console.log("\n--- 6. Draft Deletion & Refreshed List ---");

    const deleteResult = await smsCampaignService.deleteBroadcast(smsDraft.id, ws1Id);
    assert(deleteResult.success === true, "Draft deleted successfully");
    assert(deleteResult.deletedId === smsDraft.id, "Deleted ID returned in response");

    const afterDeleteList = await smsCampaignService.listBroadcasts(ws1Id, { status: "DRAFT" });
    assert(afterDeleteList.broadcasts.length === 1, "Draft count reduced to 1 after deletion");
    assert(!afterDeleteList.broadcasts.some((b: any) => b.id === smsDraft.id), "Deleted draft is absent from database");
  } finally {
    // Cleanup audit workspaces
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

runSmsCampaignsAudit().catch((err) => {
  console.error("Unhandled audit failure:", err);
  process.exit(1);
});
