import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import passport from "passport";
import { UserModel, PasswordResetModel } from "../models/user.js";
import { jwtService } from "../services/auth/jwtService.js";
import { passwordService } from "../services/auth/passwordService.js";
import { emailService } from "../services/auth/emailService.js";
import { authenticateToken } from "../middleware/auth.js";
import { config } from "../config/env.js";
import { pool } from "../db/connection.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("name").optional().trim().isLength({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, name } = req.body;

      // Validate password strength
      const passwordValidation = passwordService.validatePassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({ errors: passwordValidation.errors });
        return;
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      // Hash password
      const passwordHash = await passwordService.hashPassword(password);

      // Create user
      const user = await UserModel.createUser({
        email,
        password_hash: passwordHash,
        name: name || null,
        provider: "local",
        is_verified: false,
      });

      // Generate verification token (reuse password reset token for simplicity)
      const verificationToken = passwordService.generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours for verification
      
      await PasswordResetModel.createPasswordReset(user.id, verificationToken, expiresAt);

      // Send verification email
      try {
        await emailService.sendVerificationEmail(email, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue anyway - user can request new verification
      }

      // Generate tokens
      const accessToken = jwtService.generateAccessToken(user.id, user.email);
      const refreshToken = await jwtService.generateRefreshToken(user.id);

      res.status(201).json({
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_verified: user.is_verified,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user || !user.password_hash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Verify password
      const isValidPassword = await passwordService.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Generate tokens
      const accessToken = jwtService.generateAccessToken(user.id, user.email);
      const refreshToken = await jwtService.generateRefreshToken(user.id);

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_verified: user.is_verified,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    // Verify refresh token
    const userId = await jwtService.verifyRefreshToken(refreshToken);

    // Get user
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Generate new access token
    const accessToken = jwtService.generateAccessToken(user.id, user.email);

    res.json({
      accessToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

/**
 * POST /api/auth/logout
 * Logout and revoke refresh token
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await jwtService.revokeRefreshToken(refreshToken);
    }

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Valid email is required")],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        res.json({ message: "If the email exists, a password reset link has been sent." });
        return;
      }

      // Generate reset token
      const resetToken = passwordService.generateResetToken();
      const expiresAt = passwordService.getResetTokenExpiry();

      // Store reset token
      await PasswordResetModel.createPasswordReset(user.id, resetToken, expiresAt);

      // Send reset email
      try {
        await emailService.sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        res.status(500).json({ error: "Failed to send password reset email" });
        return;
      }

      res.json({ message: "If the email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { token, newPassword } = req.body;

      // Validate password strength
      const passwordValidation = passwordService.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({ errors: passwordValidation.errors });
        return;
      }

      // Find reset token
      const resetToken = await PasswordResetModel.findByToken(token);
      if (!resetToken) {
        res.status(400).json({ error: "Invalid or expired reset token" });
        return;
      }

      // Hash new password
      const passwordHash = await passwordService.hashPassword(newPassword);

      // Update user password
      await UserModel.updateUser(resetToken.user_id, { password_hash: passwordHash });

      // Mark token as used
      await PasswordResetModel.markAsUsed(token);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.jwtUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await UserModel.findById(req.jwtUser.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      is_verified: user.is_verified,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any; // Passport user, not JWT user
      if (!user) {
        res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
        return;
      }

      // Generate tokens
      const accessToken = jwtService.generateAccessToken(user.id, user.email);
      const refreshToken = await jwtService.generateRefreshToken(user.id);

      // Redirect to frontend with tokens
      res.redirect(
        `${config.frontendUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
    }
  }
);

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 */
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

/**
 * GET /api/auth/github/callback
 * GitHub OAuth callback
 */
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any; // Passport user, not JWT user
      if (!user) {
        res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
        return;
      }

      // Generate tokens
      const accessToken = jwtService.generateAccessToken(user.id, user.email);
      const refreshToken = await jwtService.generateRefreshToken(user.id);

      // Redirect to frontend with tokens
      res.redirect(
        `${config.frontendUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      console.error("GitHub OAuth callback error:", error);
      res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
    }
  }
);

/**
 * GET /api/auth/admin/users
 * View all users (development only!)
 */
router.get("/admin/users", async (req: Request, res: Response) => {
  // Only allow in development
  if (config.nodeEnv !== "development") {
    res.status(403).json({ error: "Not available in production" });
    return;
  }
  
  try {
    const usersResult = await pool.query(
      'SELECT id, email, name, provider, is_verified, created_at FROM users ORDER BY created_at DESC'
    );
    
    const tokensResult = await pool.query(
      'SELECT user_id, expires_at, created_at FROM refresh_tokens ORDER BY created_at DESC'
    );
    
    res.json({
      totalUsers: usersResult.rows.length,
      users: usersResult.rows,
      activeTokens: tokensResult.rows.length,
      tokens: tokensResult.rows,
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;

