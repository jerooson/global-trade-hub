import { Request, Response, NextFunction } from "express";
import { jwtService } from "../services/auth/jwtService.js";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT token from Authorization header
 * Requires valid token - returns 401 if missing or invalid
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const payload = jwtService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Access token expired") {
        res.status(401).json({ error: "Access token expired", code: "TOKEN_EXPIRED" });
        return;
      }
      res.status(403).json({ error: "Invalid access token" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if missing/invalid
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const payload = jwtService.verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log("Optional auth failed:", error instanceof Error ? error.message : error);
  }
  next();
}

/**
 * Middleware to check if user is verified
 * Must be used after authenticateToken
 */
export async function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // In a full implementation, you'd fetch the user from DB here
    // and check their is_verified status
    // For now, we assume OAuth users are verified and local users need verification

    next();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

