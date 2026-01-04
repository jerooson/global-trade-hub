import sgMail from "@sendgrid/mail";
import { config } from "../../config/env.js";

// Initialize SendGrid
if (config.sendgridApiKey) {
  sgMail.setApiKey(config.sendgridApiKey);
} else {
  console.warn("⚠️  SendGrid API key not configured. Email sending will fail.");
}

const getBaseUrl = (): string => {
  return config.nodeEnv === "production"
    ? config.frontendUrl
    : "http://localhost:8080";
};

export const emailService = {
  /**
   * Send verification email to new users
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${getBaseUrl()}/verify-email?token=${token}`;

    const msg = {
      to: email,
      from: config.emailFrom,
      subject: "Verify your TradeHub account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TradeHub!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea; margin-top: 0;">Verify Your Email Address</h2>
            
            <p>Thank you for signing up! Please verify your email address to get started with TradeHub.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you didn't create an account with TradeHub, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to TradeHub!
        
        Please verify your email address by visiting:
        ${verificationUrl}
        
        If you didn't create an account with TradeHub, you can safely ignore this email.
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error("❌ Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;

    const msg = {
      to: email,
      from: config.emailFrom,
      subject: "Reset your TradeHub password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea; margin-top: 0;">Reset Your Password</h2>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email from TradeHub. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        We received a request to reset your password. Visit the link below to create a new password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email and your password will remain unchanged.
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      console.error("❌ Error sending password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  },

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const dashboardUrl = `${getBaseUrl()}/dashboard`;

    const msg = {
      to: email,
      from: config.emailFrom,
      subject: "Welcome to TradeHub - Let's get started!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TradeHub</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome, ${name || "there"}!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Your TradeHub account is now active! 🎉</p>
            
            <p>TradeHub is your comprehensive platform for global trade management. Here's what you can do:</p>
            
            <ul style="background: white; padding: 20px 20px 20px 40px; border-radius: 5px;">
              <li style="margin-bottom: 10px;">🔍 <strong>Source Products:</strong> Find manufacturers from around the world</li>
              <li style="margin-bottom: 10px;">💰 <strong>Calculate Pricing:</strong> Get accurate cost breakdowns and margins</li>
              <li style="margin-bottom: 10px;">📊 <strong>Manage Suppliers:</strong> Track and shortlist your preferred manufacturers</li>
              <li style="margin-bottom: 10px;">🤖 <strong>AI-Powered Search:</strong> Use intelligent search to find the best matches</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              Need help getting started? Contact our support team or visit our help center.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to TradeHub, ${name || "there"}!
        
        Your account is now active! 🎉
        
        TradeHub is your comprehensive platform for global trade management. Here's what you can do:
        
        - Source Products: Find manufacturers from around the world
        - Calculate Pricing: Get accurate cost breakdowns and margins
        - Manage Suppliers: Track and shortlist your preferred manufacturers
        - AI-Powered Search: Use intelligent search to find the best matches
        
        Get started: ${dashboardUrl}
        
        Need help? Contact our support team or visit our help center.
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      console.error("❌ Error sending welcome email:", error);
      // Don't throw error for welcome email - it's not critical
    }
  },
};

