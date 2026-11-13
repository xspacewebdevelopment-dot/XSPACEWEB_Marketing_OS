import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { voiceSettingsService } from "@/lib/services/voice-settings";

const settingsSchema = z.object({
  defaultLanguage: z.string().optional(),
  defaultVoice: z.string().optional(),
  defaultSpeed: z.number().min(0.5).max(2.0).optional(),
  timezone: z.string().optional(),
  callingWindowStart: z.string().optional(),
  callingWindowEnd: z.string().optional(),
  callingDays: z.string().optional(),
  quietHoursEnabled: z.boolean().optional(),
  maxRetryAttempts: z.number().min(0).max(5).optional(),
  retryIntervalMinutes: z.number().min(5).max(1440).optional(),
  enforceConsent: z.boolean().optional(),
  enforceSuppression: z.boolean().optional(),
  requireOptInProof: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const settings = await voiceSettingsService.getOrCreateSettings(auth.workspace.id);
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load voice settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await voiceSettingsService.updateSettings(auth.workspace.id, parsed.data);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update voice settings" },
      { status: 500 }
    );
  }
}
