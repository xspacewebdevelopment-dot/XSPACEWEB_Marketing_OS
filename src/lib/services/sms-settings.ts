/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { fast2SmsProvider } from "@/lib/sms/fast2sms-provider";
import type { WalletBalanceResult } from "@/lib/sms/provider-interface";

export {
  isValidIanaTimezone,
  validatePreferredSenderId,
  isValidHexColor,
  type SmsSettingsData,
  type UpdateSmsSettingsInput,
} from "@/lib/sms/validation";
import type { SmsSettingsData, UpdateSmsSettingsInput } from "@/lib/sms/validation";
import { isValidIanaTimezone, validatePreferredSenderId, isValidHexColor } from "@/lib/sms/validation";

export class SmsSettingsService {
  /**
   * Retrieve workspace SMS & RCS settings, lazily initializing defaults if not yet created.
   * Scoped strictly to workspaceId.
   */
  public async getSettings(workspaceId: string): Promise<SmsSettingsData> {
    if (!workspaceId || typeof workspaceId !== "string" || !workspaceId.trim()) {
      throw new Error("Workspace ID is required");
    }

    const cleanWorkspaceId = workspaceId.trim();

    let settings = await (prisma as any).smsSettings.findUnique({
      where: { workspaceId: cleanWorkspaceId },
    });

    if (!settings) {
      settings = await (prisma as any).smsSettings.create({
        data: {
          workspaceId: cleanWorkspaceId,
          defaultSenderId: "NEXAREACH",
          defaultChannel: "SMS",
          timezone: "UTC",
          enforceStopOptOut: true,
          encodingPreference: "AUTO",
          rcsBrandName: "NexaReach Marketing OS",
          rcsBrandColor: "#2563EB",
        },
      });
    }

    return settings as SmsSettingsData;
  }

  /**
   * Update workspace SMS & RCS settings with strict validation.
   * Scoped strictly to workspaceId.
   */
  public async updateSettings(
    workspaceId: string,
    data: UpdateSmsSettingsInput
  ): Promise<SmsSettingsData> {
    if (!workspaceId || typeof workspaceId !== "string" || !workspaceId.trim()) {
      throw new Error("Workspace ID is required");
    }

    const cleanWorkspaceId = workspaceId.trim();
    const updateData: any = {};

    // 1. Validate Preferred Sender ID
    if (data.defaultSenderId !== undefined) {
      const senderCheck = validatePreferredSenderId(data.defaultSenderId);
      if (!senderCheck.valid) {
        throw new Error(senderCheck.error || "Invalid preferred sender ID");
      }
      updateData.defaultSenderId = senderCheck.normalized;
    }

    // 2. Validate Default Channel
    if (data.defaultChannel !== undefined) {
      const channel = String(data.defaultChannel).toUpperCase();
      if (channel !== "SMS" && channel !== "RCS") {
        throw new Error("Default channel must be either 'SMS' or 'RCS'");
      }
      updateData.defaultChannel = channel;
    }

    // 3. Validate Timezone
    if (data.timezone !== undefined) {
      const tz = data.timezone.trim();
      if (!isValidIanaTimezone(tz)) {
        throw new Error(`Invalid IANA timezone identifier: '${tz}'`);
      }
      updateData.timezone = tz;
    }

    // 4. Validate Opt-Out Enforcement
    if (data.enforceStopOptOut !== undefined) {
      updateData.enforceStopOptOut = Boolean(data.enforceStopOptOut);
    }

    // 5. Validate Encoding Preference
    if (data.encodingPreference !== undefined) {
      const enc = String(data.encodingPreference).toUpperCase();
      if (enc !== "AUTO" && enc !== "GSM-7" && enc !== "UCS-2") {
        throw new Error("Encoding preference must be 'AUTO', 'GSM-7', or 'UCS-2'");
      }
      updateData.encodingPreference = enc;
    }

    // 6. Validate RCS Brand Name
    if (data.rcsBrandName !== undefined) {
      const brand = data.rcsBrandName.trim();
      if (!brand) {
        throw new Error("RCS Brand Name cannot be empty");
      }
      if (brand.length > 120) {
        throw new Error("RCS Brand Name cannot exceed 120 characters");
      }
      updateData.rcsBrandName = brand;
    }

    // 7. Validate RCS Brand Color
    if (data.rcsBrandColor !== undefined) {
      const color = data.rcsBrandColor.trim();
      if (!isValidHexColor(color)) {
        throw new Error("RCS Brand Color must be a valid hex color code (e.g. #2563EB)");
      }
      updateData.rcsBrandColor = color;
    }

    // Atomic upsert strictly isolated to workspaceId
    const updated = await (prisma as any).smsSettings.upsert({
      where: { workspaceId: cleanWorkspaceId },
      create: {
        workspaceId: cleanWorkspaceId,
        defaultSenderId: updateData.defaultSenderId || "NEXAREACH",
        defaultChannel: updateData.defaultChannel || "SMS",
        timezone: updateData.timezone || "UTC",
        enforceStopOptOut: updateData.enforceStopOptOut ?? true,
        encodingPreference: updateData.encodingPreference || "AUTO",
        rcsBrandName: updateData.rcsBrandName || "NexaReach Marketing OS",
        rcsBrandColor: updateData.rcsBrandColor || "#2563EB",
      },
      update: updateData,
    });

    return updated as SmsSettingsData;
  }

  /**
   * Returns current Fast2SMS provider configuration status and capabilities.
   * Scoped strictly to workspaceId.
   */
  public async getProviderStatus(workspaceId: string) {
    if (!workspaceId) throw new Error("Workspace ID is required");
    const isConfigured = fast2SmsProvider.isConfigured();
    return {
      provider: "FAST2SMS",
      isConfigured,
      status: isConfigured ? "CONFIGURED" : "NOT_CONFIGURED",
      rcsStatus: "NOT_CONNECTED",
      supportedRoutes: ["q", "dlt"],
      disclaimer: "Fast2SMS operates on Indian (+91) 10-digit mobile numbers. DLT regulations apply to commercial routes.",
    };
  }

  /**
   * Test connection to Fast2SMS using non-destructive wallet balance API.
   * Never sends an SMS or debits credits.
   */
  public async testProviderConnection(workspaceId: string): Promise<WalletBalanceResult> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    return fast2SmsProvider.testConnection();
  }
}

export const smsSettingsService = new SmsSettingsService();
