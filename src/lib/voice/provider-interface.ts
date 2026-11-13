/**
 * Voice Provider Abstraction Layer
 * 
 * Provides an integration-ready interface for future outbound voice providers
 * (e.g. Twilio Voice, Vonage Voice, Plivo, Telnyx).
 * 
 * CRITICAL SAFETY RULES:
 * 1. Outbound phone calls remain DISABLED until an approved external provider adapter is connected.
 * 2. No real calls are placed.
 * 3. All dispatch attempts with NotConnectedVoiceProvider return NOT_CONNECTED or UNAVAILABLE status.
 * 4. Never expose API secrets or credentials to client-side code.
 */

export type VoiceProviderStatus = "NOT_CONNECTED" | "CONFIGURED" | "CONNECTED" | "SUSPENDED";

export interface VoiceCallStatusResult {
  providerCallId: string;
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "BUSY" | "NO_ANSWER" | "FAILED" | "CANCELLED";
  durationSeconds?: number | null;
  failureCode?: string | null;
  failureReason?: string | null;
  timestamp: Date;
}

export interface VoiceDispatchParams {
  jobId: string;
  campaignId: string;
  workspaceId: string;
  destinationPhoneE164: string;
  scriptText: string;
  language: string;
  voiceId: string;
  speed: number;
}

export interface VoiceDispatchResult {
  success: boolean;
  status: "NOT_CONNECTED" | "QUEUED" | "FAILED";
  providerCallId?: string | null;
  providerName?: string;
  errorMessage?: string;
  isSimulated: boolean;
}

export interface VoiceProviderAdapter {
  readonly name: string;
  readonly status: VoiceProviderStatus;
  
  isConfigured(): boolean;
  validateConfiguration(): Promise<{ valid: boolean; message: string }>;
  dispatchCall(params: VoiceDispatchParams): Promise<VoiceDispatchResult>;
  getCallStatus(providerCallId: string): Promise<VoiceCallStatusResult>;
}

/**
 * Default Safety Adapter: NotConnectedVoiceProvider
 * 
 * Used when no external voice provider is configured.
 * Strictly prevents real outbound calls and returns explicit NOT_CONNECTED diagnostics.
 */
export class NotConnectedVoiceProvider implements VoiceProviderAdapter {
  public readonly name = "NONE";
  public readonly status: VoiceProviderStatus = "NOT_CONNECTED";

  public isConfigured(): boolean {
    return false;
  }

  public async validateConfiguration(): Promise<{ valid: boolean; message: string }> {
    return {
      valid: false,
      message: "No external voice provider is connected. Voice campaigns operate in internal draft & simulation mode.",
    };
  }

  public async dispatchCall(params: VoiceDispatchParams): Promise<VoiceDispatchResult> {
    return {
      success: false,
      status: "NOT_CONNECTED",
      providerName: this.name,
      providerCallId: null,
      errorMessage: `Voice dispatch unavailable: Provider not connected for destination ${params.destinationPhoneE164}. Outbound calling is disabled.`,
      isSimulated: true,
    };
  }

  public async getCallStatus(providerCallId: string): Promise<VoiceCallStatusResult> {
    return {
      providerCallId,
      status: "FAILED",
      durationSeconds: null,
      failureCode: "PROVIDER_NOT_CONNECTED",
      failureReason: "External voice provider is not connected.",
      timestamp: new Date(),
    };
  }
}

export const activeVoiceProvider: VoiceProviderAdapter = new NotConnectedVoiceProvider();
