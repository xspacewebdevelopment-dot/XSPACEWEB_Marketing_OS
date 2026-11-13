/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

export interface VoiceSettingsData {
  id: string;
  workspaceId: string;
  defaultLanguage: string;
  defaultVoice: string;
  defaultSpeed: number;
  timezone: string;
  callingWindowStart: string;
  callingWindowEnd: string;
  callingDays: string;
  quietHoursEnabled: boolean;
  maxRetryAttempts: number;
  retryIntervalMinutes: number;
  enforceConsent: boolean;
  enforceSuppression: boolean;
  requireOptInProof: boolean;
  providerStatus: string;
  providerName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateVoiceSettingsInput {
  defaultLanguage?: string;
  defaultVoice?: string;
  defaultSpeed?: number;
  timezone?: string;
  callingWindowStart?: string;
  callingWindowEnd?: string;
  callingDays?: string;
  quietHoursEnabled?: boolean;
  maxRetryAttempts?: number;
  retryIntervalMinutes?: number;
  enforceConsent?: boolean;
  enforceSuppression?: boolean;
  requireOptInProof?: boolean;
}

export class VoiceSettingsService {
  /**
   * Retrieves voice settings strictly scoped to workspaceId.
   * Creates default settings record if not yet initialized.
   */
  public async getOrCreateSettings(workspaceId: string): Promise<VoiceSettingsData> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    let settings = await (prisma as any).voiceSettings.findUnique({
      where: { workspaceId },
    });

    if (!settings) {
      settings = await (prisma as any).voiceSettings.create({
        data: {
          workspaceId,
          defaultLanguage: "en-US",
          defaultVoice: "alloy",
          defaultSpeed: 1.0,
          timezone: "UTC",
          callingWindowStart: "09:00",
          callingWindowEnd: "20:00",
          callingDays: "MON_FRI",
          quietHoursEnabled: true,
          maxRetryAttempts: 3,
          retryIntervalMinutes: 30,
          enforceConsent: true,
          enforceSuppression: true,
          requireOptInProof: true,
          providerStatus: "NOT_CONNECTED",
          providerName: null,
        },
      });
    }

    return settings;
  }

  /**
   * Updates workspace voice settings with validation.
   */
  public async updateSettings(
    workspaceId: string,
    input: UpdateVoiceSettingsInput
  ): Promise<VoiceSettingsData> {
    if (!workspaceId) throw new Error("Workspace ID is required");

    // Ensure settings record exists first
    await this.getOrCreateSettings(workspaceId);

    const updateData: any = {};

    if (input.defaultLanguage !== undefined) updateData.defaultLanguage = input.defaultLanguage.trim();
    if (input.defaultVoice !== undefined) updateData.defaultVoice = input.defaultVoice.trim();
    if (input.defaultSpeed !== undefined) {
      const speed = Number(input.defaultSpeed);
      if (speed >= 0.5 && speed <= 2.0) {
        updateData.defaultSpeed = speed;
      }
    }
    if (input.timezone !== undefined) updateData.timezone = input.timezone.trim();
    if (input.callingWindowStart !== undefined) updateData.callingWindowStart = input.callingWindowStart.trim();
    if (input.callingWindowEnd !== undefined) updateData.callingWindowEnd = input.callingWindowEnd.trim();
    if (input.callingDays !== undefined) updateData.callingDays = input.callingDays;
    if (input.quietHoursEnabled !== undefined) updateData.quietHoursEnabled = Boolean(input.quietHoursEnabled);
    if (input.maxRetryAttempts !== undefined) {
      updateData.maxRetryAttempts = Math.max(0, Math.min(5, Number(input.maxRetryAttempts)));
    }
    if (input.retryIntervalMinutes !== undefined) {
      updateData.retryIntervalMinutes = Math.max(5, Math.min(1440, Number(input.retryIntervalMinutes)));
    }
    if (input.enforceConsent !== undefined) updateData.enforceConsent = Boolean(input.enforceConsent);
    if (input.enforceSuppression !== undefined) updateData.enforceSuppression = Boolean(input.enforceSuppression);
    if (input.requireOptInProof !== undefined) updateData.requireOptInProof = Boolean(input.requireOptInProof);

    const updated = await (prisma as any).voiceSettings.update({
      where: { workspaceId },
      data: updateData,
    });

    return updated;
  }
}

export const voiceSettingsService = new VoiceSettingsService();
