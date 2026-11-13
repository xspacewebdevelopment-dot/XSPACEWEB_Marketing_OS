/**
 * Telephony SMS & RCS Provider Abstraction
 * Enforces strict type boundaries, route selection, and safe error handling.
 */

export type SmsRoute = "q" | "dlt";

export interface WalletBalanceResult {
  success: boolean;
  isConfigured: boolean;
  walletBalance?: number;
  currency?: string;
  error?: string;
  statusCode?: number;
}

export interface SendSmsOptions {
  recipientPhone: string;
  messageText: string;
  route?: SmsRoute;
  senderId?: string;
  dltTemplateId?: string;
  variablesValues?: string;
  isLive?: boolean;
  clientRequestId?: string;
}

export interface SendSmsResult {
  success: boolean;
  status: "SUBMITTED_TO_CARRIER" | "SIMULATED" | "FAILED" | "REJECTED";
  provider: "FAST2SMS" | "SIMULATION";
  requestId?: string;
  recipientPhoneNorm?: string;
  isSimulated: boolean;
  error?: string;
  statusCode?: number;
  deliveryState: "PENDING_DELIVERY_CONFIRMATION" | "SIMULATED_LOCAL" | "UNDELIVERED";
}

export interface SendRcsOptions {
  recipientPhone: string;
  messageText: string;
  cardTitle?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  mediaUrl?: string | null;
  isLive?: boolean;
}

export interface SendRcsResult {
  success: boolean;
  status: "NOT_CONNECTED" | "SIMULATED" | "FAILED";
  provider: string;
  error: string;
}

export interface SmsProviderInterface {
  readonly providerName: string;
  isConfigured(): boolean;
  testConnection(): Promise<WalletBalanceResult>;
  sendSms(options: SendSmsOptions): Promise<SendSmsResult>;
  sendRcs(options: SendRcsOptions): Promise<SendRcsResult>;
}
