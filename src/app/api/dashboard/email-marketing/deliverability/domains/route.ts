import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { deliverabilityService } from "@/lib/services/deliverability";

const addDomainSchema = z.object({
  domain: z.string().min(3, "Domain name is required").max(253),
  region: z.enum(["us-east-1", "eu-west-1", "sa-east-1", "ap-northeast-1"]).default("us-east-1"),
});

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const domains = await deliverabilityService.getDomains(auth.workspace.id);
    return NextResponse.json({ success: true, data: domains });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch sending domains";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check workspace permissions: OWNER or ADMIN
    if (auth.role !== "OWNER" && auth.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only workspace owners and administrators can add sending domains." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = addDomainSchema.parse(body);

    const result = await deliverabilityService.addDomain(
      auth.workspace.id,
      validated.domain,
      validated.region
    );

    return NextResponse.json({
      success: true,
      data: result.domain,
      dnsResult: result.dnsResult,
      dmarcAnalysis: result.dmarcAnalysis,
      message: `Domain ${result.domain.domain} added successfully. Please configure the required DNS records.`,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const issue = err.issues?.[0];
      return NextResponse.json(
        { success: false, error: issue?.message || "Invalid domain input" },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to add sending domain";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
