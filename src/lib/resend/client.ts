import { Resend } from "resend";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  from: string;
  to: string | string[];
  statusCode?: number;
  error?: string;
  rawResponse?: any;
}

class ResendService {
  private resend: Resend | null = null;
  private readonly fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || "NexaReach <marketing@xspaceweb.com>";

    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  public isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  public getSenderAddress(): string {
    return this.fromAddress;
  }

  /**
   * Sends an email through the official Resend API.
   * Returns genuine provider response including messageId or error details.
   */
  public async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.resend) {
      return {
        success: false,
        from: options.from || this.fromAddress,
        to: options.to,
        error: "RESEND_API_KEY is not configured in environment variables.",
      };
    }

    try {
      const from = options.from || this.fromAddress;
      const { data, error } = await this.resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      if (error) {
        return {
          success: false,
          from,
          to: options.to,
          error: error.message || "Failed to send email via Resend API",
          rawResponse: error,
        };
      }

      return {
        success: true,
        messageId: data?.id,
        from,
        to: options.to,
        rawResponse: data,
      };
    } catch (err: any) {
      return {
        success: false,
        from: options.from || this.fromAddress,
        to: options.to,
        error: err?.message || "Unexpected error occurred during Resend API call",
        rawResponse: err,
      };
    }
  }
}

export const resendService = new ResendService();
