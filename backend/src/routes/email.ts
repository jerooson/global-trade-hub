import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { emailService, EmailRecipient } from "../services/email/resendService.js";
import { pool } from "../db/connection.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

router.post(
  "/send-bulk",
  authenticateToken,
  [
    body("subject").notEmpty().withMessage("Subject is required"),
    body("content").notEmpty().withMessage("Content is required"),
    body("recipients").isArray({ min: 1 }).withMessage("At least one recipient is required"),
    body("recipients.*.email").isEmail().withMessage("Valid email is required"),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, content, recipients } = req.body as {
      subject: string;
      content: string;
      recipients: EmailRecipient[];
    };

    const userId = req.user?.id;

    try {
      const campaignResult = await pool.query(
        `INSERT INTO email_campaigns (user_id, subject, content, total_recipients, status)
         VALUES ($1, $2, $3, $4, 'sending')
         RETURNING id`,
        [userId, subject, content, recipients.length]
      );

      const campaignId = campaignResult.rows[0].id;

      for (const recipient of recipients) {
        await pool.query(
          `INSERT INTO email_recipients (campaign_id, email, name, status)
           VALUES ($1, $2, $3, 'pending')`,
          [campaignId, recipient.email, recipient.name || null]
        );
      }

      const result = await emailService.sendBulkEmails({
        to: recipients,
        subject,
        html: content,
      });

      for (const emailResult of result.results) {
        await pool.query(
          `UPDATE email_recipients
           SET status = $1, error_message = $2, sent_at = $3
           WHERE campaign_id = $4 AND email = $5`,
          [
            emailResult.success ? "sent" : "failed",
            emailResult.error || null,
            emailResult.success ? new Date() : null,
            campaignId,
            emailResult.email,
          ]
        );
      }

      await pool.query(
        `UPDATE email_campaigns
         SET sent_count = $1, failed_count = $2, status = 'completed', sent_at = NOW()
         WHERE id = $3`,
        [result.sentCount, result.failedCount, campaignId]
      );

      res.json({
        success: true,
        campaignId,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        totalRecipients: recipients.length,
      });
    } catch (error: any) {
      console.error("Failed to send bulk emails:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send emails",
        message: error.message,
      });
    }
  }
);

router.get(
  "/campaigns",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      const result = await pool.query(
        `SELECT id, subject, total_recipients, sent_count, failed_count, status, created_at, sent_at
         FROM email_campaigns
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );

      res.json({ campaigns: result.rows });
    } catch (error: any) {
      console.error("Failed to fetch campaigns:", error);
      res.status(500).json({
        error: "Failed to fetch campaigns",
        message: error.message,
      });
    }
  }
);

router.get(
  "/campaigns/:campaignId",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { campaignId } = req.params;
    const userId = req.user?.id;

    try {
      const campaignResult = await pool.query(
        `SELECT * FROM email_campaigns
         WHERE id = $1 AND user_id = $2`,
        [campaignId, userId]
      );

      if (campaignResult.rows.length === 0) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const recipientsResult = await pool.query(
        `SELECT email, name, status, error_message, sent_at
         FROM email_recipients
         WHERE campaign_id = $1
         ORDER BY created_at`,
        [campaignId]
      );

      res.json({
        campaign: campaignResult.rows[0],
        recipients: recipientsResult.rows,
      });
    } catch (error: any) {
      console.error("Failed to fetch campaign details:", error);
      res.status(500).json({
        error: "Failed to fetch campaign details",
        message: error.message,
      });
    }
  }
);

export default router;
