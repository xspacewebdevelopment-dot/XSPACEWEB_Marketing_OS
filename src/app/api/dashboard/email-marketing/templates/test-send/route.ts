import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { resendService } from "@/lib/resend/client";
import { interpolatePersonalization, wrapInEmailContainer } from "@/lib/templates/compiler";
import { deliverabilityService } from "@/lib/services/deliverability";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";

const testSendSchema = z.object({
  recipientEmail: z.string().email("Please provide a valid recipient email address"),
  subject: z.string().min(1, "Subject line is required").max(200),
  html: z.string().min(1, "Email HTML content is required"),
  preheader: z.string().optional().nullable(),
  personalization: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = testSendSchema.parse(body);

    if (!resendService.isConfigured()) {
      return NextResponse.json(
        {
          error: "Resend API key is not configured in environment variables.",
          isConfigured: false,
        },
        { status: 500 }
      );
    }

    const senderAddress = resendService.getSenderAddress();

    // 1. Deliverability Pre-Send Safety Guard
    const safetyCheck = await deliverabilityService.checkPreSendDeliverability(
      auth.workspace.id,
      senderAddress,
      [validated.recipientEmail]
    );

    // Apply automatic blocking for critical safety conditions (e.g. active suppression entries)
    if (!safetyCheck.canSend) {
      return NextResponse.json(
        {
          success: false,
          error: safetyCheck.criticalIssues.join(" ") || "Sending blocked by deliverability safety policy.",
          isBlockedBySafety: true,
          criticalIssues: safetyCheck.criticalIssues,
          warnings: safetyCheck.warnings,
          suppressedRecipients: safetyCheck.suppressedRecipients,
        },
        { status: 400 }
      );
    }

    const customFirstName = validated.personalization?.first_name || auth.user.name?.split(" ")[0] || "Marketer";
    const customLastName = validated.personalization?.last_name || auth.user.name?.split(" ")[1] || "Lead";
    const customCompany = validated.personalization?.company || auth.workspace.name || "NexaReach";

    // Interpolate personalization variables with sample or custom test data
    const personalizedHtml = interpolatePersonalization(validated.html, {
      first_name: customFirstName,
      last_name: customLastName,
      email: validated.recipientEmail,
      company: customCompany,
      unsubscribe_url: `http://localhost:3000/unsubscribe?email=${encodeURIComponent(validated.recipientEmail)}`,
      ...(validated.personalization || {}),
    });

    // Ensure email container wrapper
    const fullHtml = personalizedHtml.includes("<!DOCTYPE html>")
      ? personalizedHtml
      : wrapInEmailContainer(personalizedHtml, {
          title: validated.subject,
          preheader: validated.preheader || "",
        });

    const personalizedSubject = interpolatePersonalization(validated.subject, {
      first_name: customFirstName,
      company: customCompany,
    });

    const fullSubject = `[TEST] ${personalizedSubject}`;

    // Send via verified Resend sender
    const result = await resendService.sendEmail({
      to: validated.recipientEmail,
      subject: fullSubject,
      html: fullHtml,
    });

    if (!result.success) {
      // Record failed dispatch in database
      await prisma.emailSendRecord.create({
        data: {
          workspaceId: auth.workspace.id,
          userId: auth.user.id,
          recipientEmail: validated.recipientEmail,
          normalizedEmail: normalizeEmail(validated.recipientEmail),
          senderEmail: result.from,
          subject: fullSubject,
          status: "FAILED",
          source: "TEST",
          errorMessage: result.error || "Resend API rejected the test send request",
          rawResponse: result.rawResponse ? (result.rawResponse as any) : undefined,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || "Resend API rejected the test send request",
          rawResponse: result.rawResponse,
          from: result.from,
          to: result.to,
          warnings: safetyCheck.warnings,
        },
        { status: 400 }
      );
    }

    // Persist successful dispatch in EmailSendRecord
    const sendRecord = await prisma.emailSendRecord.create({
      data: {
        workspaceId: auth.workspace.id,
        userId: auth.user.id,
        resendId: result.messageId,
        recipientEmail: validated.recipientEmail,
        normalizedEmail: normalizeEmail(validated.recipientEmail),
        senderEmail: result.from,
        subject: fullSubject,
        status: "SENT",
        source: "TEST",
        rawResponse: result.rawResponse ? (result.rawResponse as any) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      sendRecordId: sendRecord.id,
      messageId: result.messageId,
      from: result.from,
      to: result.to,
      subject: fullSubject,
      sentAt: new Date().toISOString(),
      rawResponse: result.rawResponse,
      warnings: safetyCheck.warnings,
      note: "Request accepted by Resend API. The email was dispatched to the upstream provider queue.",
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const issue = (err as any).issues?.[0] || (err as any).errors?.[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid test email payload" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to process test email sending" },
      { status: 500 }
    );
  }
}
