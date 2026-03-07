import { Resend } from "resend";
import { config } from "../../config/env.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  html: string;
  from?: string;
}

export interface BulkEmailResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  results: Array<{
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export class ResendEmailService {
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  }

  async sendSingleEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await resend.emails.send({
        from: params.from || this.defaultFrom,
        to: params.to.map(r => r.email),
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        console.error("Resend error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }

  async sendBulkEmails(params: SendEmailParams): Promise<BulkEmailResult> {
    const results: Array<{
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of params.to) {
      const result = await this.sendSingleEmail({
        to: [recipient],
        subject: params.subject,
        html: params.html,
        from: params.from,
      });

      if (result.success) {
        sentCount++;
        results.push({
          email: recipient.email,
          success: true,
          messageId: result.messageId,
        });
      } else {
        failedCount++;
        results.push({
          email: recipient.email,
          success: false,
          error: result.error,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      results,
    };
  }

  async sendBatchEmails(emails: Array<{ to: string; subject: string; html: string }>): Promise<BulkEmailResult> {
    const results: Array<{
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    let sentCount = 0;
    let failedCount = 0;

    for (const email of emails) {
      const result = await this.sendSingleEmail({
        to: [{ email: email.to }],
        subject: email.subject,
        html: email.html,
      });

      if (result.success) {
        sentCount++;
        results.push({
          email: email.to,
          success: true,
          messageId: result.messageId,
        });
      } else {
        failedCount++;
        results.push({
          email: email.to,
          success: false,
          error: result.error,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      results,
    };
  }
}

export const emailService = new ResendEmailService();
