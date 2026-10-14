import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { resendService } from "@/lib/resend/client";
import { interpolatePersonalization, wrapInEmailContainer } from "@/lib/templates/compiler";

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

    // Send via verified Resend sender
    const result = await resendService.sendEmail({
      to: validated.recipientEmail,
      subject: `[TEST] ${personalizedSubject}`,
      html: fullHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Resend API rejected the test send request",
          rawResponse: result.rawResponse,
          from: result.from,
          to: result.to,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      from: result.from,
      to: result.to,
      subject: `[TEST] ${personalizedSubject}`,
      sentAt: new Date().toISOString(),
      rawResponse: result.rawResponse,
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
