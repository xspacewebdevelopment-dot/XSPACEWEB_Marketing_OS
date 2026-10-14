import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { Prisma } from "@prisma/client";

interface ResendWebhookData {
  id?: string;
  email_id?: string;
  to?: string | string[];
  from?: string;
  subject?: string;
  message?: string;
  [key: string]: unknown;
}

interface ResendWebhookPayload {
  type?: string;
  created_at?: string;
  data?: ResendWebhookData;
}

/**
 * Resend Webhook Receiver
 * Listens for genuine provider delivery, bounce, and complaint events.
 * Automatically synchronizes send records and updates the suppression list on hard bounce or spam complaint.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let payload: ResendWebhookPayload;

    try {
      payload = JSON.parse(rawBody) as ResendWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, data, created_at } = payload;

    if (!type || !data) {
      return NextResponse.json({ error: "Missing required webhook fields" }, { status: 400 });
    }

    const resendId = data.email_id || data.id;
    const recipient = Array.isArray(data.to) ? data.to[0] : data.to;
    const normalizedRecipient = recipient ? normalizeEmail(recipient) : null;

    // Find corresponding send record if exists
    const sendRecord = resendId
      ? await prisma.emailSendRecord.findFirst({
          where: { resendId },
        })
      : null;

    const workspaceId = sendRecord?.workspaceId || null;

    // Persist raw webhook event
    await prisma.emailWebhookEvent.create({
      data: {
        workspaceId,
        resendId,
        eventType: type,
        payload: payload as unknown as Prisma.InputJsonValue,
        processed: true,
      },
    });

    const eventDate = created_at ? new Date(created_at) : new Date();

    // Handle event types
    switch (type) {
      case "email.delivered": {
        if (sendRecord) {
          await prisma.emailSendRecord.update({
            where: { id: sendRecord.id },
            data: {
              status: "DELIVERED",
              deliveredAt: eventDate,
            },
          });
        }
        break;
      }

      case "email.bounced": {
        if (sendRecord) {
          await prisma.emailSendRecord.update({
            where: { id: sendRecord.id },
            data: {
              status: "BOUNCED",
              bouncedAt: eventDate,
              bounceDetails: data as unknown as Prisma.InputJsonValue,
            },
          });
        }

        // Automatic suppression on bounce to protect domain reputation
        if (workspaceId && normalizedRecipient) {
          const existing = await prisma.suppressionEntry.findUnique({
            where: {
              workspaceId_normalizedEmail: {
                workspaceId,
                normalizedEmail: normalizedRecipient,
              },
            },
          });

          if (!existing) {
            const suppression = await prisma.suppressionEntry.create({
              data: {
                workspaceId,
                email: recipient,
                normalizedEmail: normalizedRecipient,
                reason: "BOUNCE",
                source: "BOUNCE",
                notes: `Automatically suppressed via Resend bounce event: ${data.message || "Hard bounce"}`,
                status: "ACTIVE",
              },
            });

            await prisma.suppressionAuditLog.create({
              data: {
                workspaceId,
                suppressionId: suppression.id,
                email: recipient || normalizedRecipient,
                normalizedEmail: normalizedRecipient,
                action: "ADDED",
                reason: "BOUNCE",
                source: "RESEND_WEBHOOK",
                justification: "Automated bounce suppression to protect sender reputation",
                metadata: data as unknown as Prisma.InputJsonValue,
              },
            });
          }
        }
        break;
      }

      case "email.complained": {
        if (sendRecord) {
          await prisma.emailSendRecord.update({
            where: { id: sendRecord.id },
            data: {
              status: "COMPLAINED",
              complainedAt: eventDate,
              bounceDetails: data as unknown as Prisma.InputJsonValue,
            },
          });
        }

        // Automatic suppression on spam complaint
        if (workspaceId && normalizedRecipient) {
          const existing = await prisma.suppressionEntry.findUnique({
            where: {
              workspaceId_normalizedEmail: {
                workspaceId,
                normalizedEmail: normalizedRecipient,
              },
            },
          });

          if (!existing) {
            const suppression = await prisma.suppressionEntry.create({
              data: {
                workspaceId,
                email: recipient,
                normalizedEmail: normalizedRecipient,
                reason: "COMPLAINT",
                source: "COMPLAINT",
                notes: "Automatically suppressed via Resend spam complaint callback",
                status: "ACTIVE",
              },
            });

            await prisma.suppressionAuditLog.create({
              data: {
                workspaceId,
                suppressionId: suppression.id,
                email: recipient || normalizedRecipient,
                normalizedEmail: normalizedRecipient,
                action: "ADDED",
                reason: "COMPLAINT",
                source: "RESEND_WEBHOOK",
                justification: "Recipient marked email as spam",
                metadata: data as unknown as Prisma.InputJsonValue,
              },
            });
          }
        }
        break;
      }

      case "email.sent": {
        if (sendRecord && sendRecord.status === "QUEUED") {
          await prisma.emailSendRecord.update({
            where: { id: sendRecord.id },
            data: { status: "SENT" },
          });
        }
        break;
      }

      default:
        // Other events (delivery_delayed, opened, clicked) are logged in webhook events
        break;
    }

    return NextResponse.json({ success: true, processed: true, eventType: type });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process webhook";
    console.error("Resend webhook error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
