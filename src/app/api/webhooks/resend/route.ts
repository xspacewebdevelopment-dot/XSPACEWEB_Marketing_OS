import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Resend Webhook Ingestion Endpoint
 * Cleanly prepared for future authenticated webhook delivery events.
 * Accepts Resend payload events (email.delivered, email.opened, email.clicked, email.bounced, email.complained).
 * Does not require webhooks to be pre-configured during initial setup.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const eventType = payload.type; // e.g. "email.delivered", "email.opened", "email.clicked", "email.bounced"
    const data = payload.data || {};
    const emailId = data.email_id;
    const recipient = data.to?.[0];

    if (!eventType || !emailId) {
      return NextResponse.json(
        { received: true, note: "Ignored unhandled event format" },
        { status: 200 }
      );
    }

    // Lookup snapshot by providerMessageId
    const snapshot = await prisma.campaignRecipientSnapshot.findFirst({
      where: { providerMessageId: emailId },
      include: { campaign: true },
    });

    if (snapshot) {
      const campaignId = snapshot.campaignId;
      const normalizedType = eventType.replace("email.", "").toUpperCase();

      // Record immutable EmailEvent
      await prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: snapshot.email,
          eventType: normalizedType,
          provider: "RESEND",
          providerMessageId: emailId,
          metadata: data,
        },
      });

      // Update snapshot status & timestamps accordingly
      if (normalizedType === "DELIVERED") {
        await prisma.campaignRecipientSnapshot.update({
          where: { id: snapshot.id },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { deliveredCount: { increment: 1 } },
        });
      } else if (normalizedType === "OPENED") {
        await prisma.campaignRecipientSnapshot.update({
          where: { id: snapshot.id },
          data: { openedAt: new Date() },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { openedCount: { increment: 1 } },
        });
      } else if (normalizedType === "CLICKED") {
        await prisma.campaignRecipientSnapshot.update({
          where: { id: snapshot.id },
          data: { clickedAt: new Date() },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { clickedCount: { increment: 1 } },
        });
      } else if (normalizedType === "BOUNCED") {
        await prisma.campaignRecipientSnapshot.update({
          where: { id: snapshot.id },
          data: { status: "BOUNCED", bouncedAt: new Date() },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { bouncedCount: { increment: 1 } },
        });
        // Automatically add to Suppression List
        await prisma.suppressionEntry.upsert({
          where: {
            workspaceId_normalizedEmail: {
              workspaceId: snapshot.campaign.workspaceId,
              normalizedEmail: snapshot.normalizedEmail,
            },
          },
          create: {
            workspaceId: snapshot.campaign.workspaceId,
            email: snapshot.email,
            normalizedEmail: snapshot.normalizedEmail,
            reason: "HARD_BOUNCE",
            source: "BOUNCE",
            notes: "Automated Resend bounce webhook notification",
          },
          update: {
            status: "ACTIVE",
            reason: "HARD_BOUNCE",
            source: "BOUNCE",
          },
        });
      } else if (normalizedType === "COMPLAINED") {
        await prisma.campaignRecipientSnapshot.update({
          where: { id: snapshot.id },
          data: { status: "COMPLAINED" },
        });
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { complainedCount: { increment: 1 } },
        });
        // Automatically add to Suppression List
        await prisma.suppressionEntry.upsert({
          where: {
            workspaceId_normalizedEmail: {
              workspaceId: snapshot.campaign.workspaceId,
              normalizedEmail: snapshot.normalizedEmail,
            },
          },
          create: {
            workspaceId: snapshot.campaign.workspaceId,
            email: snapshot.email,
            normalizedEmail: snapshot.normalizedEmail,
            reason: "SPAM_COMPLAINT",
            source: "COMPLAINT",
            notes: "Automated Resend complaint webhook notification",
          },
          update: {
            status: "ACTIVE",
            reason: "SPAM_COMPLAINT",
            source: "COMPLAINT",
          },
        });
      }
    }

    return NextResponse.json({ received: true, processed: Boolean(snapshot) }, { status: 200 });
  } catch (err: any) {
    console.error("Resend Webhook Ingestion Error:", err);
    return NextResponse.json(
      { error: err.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
