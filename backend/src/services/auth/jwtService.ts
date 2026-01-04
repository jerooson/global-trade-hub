import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../../config/env.js";
import { RefreshTokenModel } from "../../models/user.js";

export interface JWTPayload {
  userId: string;
  email: string;
}

export const jwtService = {
  /**
   * Generate a short-lived access token (15 minutes)
   */
  generateAccessToken(userId: string, email: string): string {
    const payload: JWTPayload = { userId, email };
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtAccessExpiry,
    });
  },

  /**
   * Generate a long-lived refresh token (7 days) and store in database
   */
  async generateRefreshToken(userId: string): Promise<string> {
    // Generate a random token
    const token = crypto.randomBytes(64).toString("hex");
    
    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Store in database
    await RefreshTokenModel.createRefreshToken(userId, token, expiresAt);
    
    return token;
  },

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Access token expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid access token");
      }
      throw error;
    }
  },

  /**
   * Verify refresh token exists in database and is not expired
   */
  async verifyRefreshToken(token: string): Promise<string> {
    const refreshToken = await RefreshTokenModel.findByToken(token);
    
    if (!refreshToken) {
      throw new Error("Invalid or expired refresh token");
    }
    
    return refreshToken.user_id;
  },

  /**
   * Revoke a refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await RefreshTokenModel.deleteByToken(token);
  },

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshTokenModel.deleteByUserId(userId);
  },

  /**
   * Clean up expired refresh tokens (can be run periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await RefreshTokenModel.deleteExpired();
  },
};

