import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { User } from "../models/User.js";
import { BlacklistedToken } from "../models/BlacklistedToken.js";
import * as authService from "../services/auth.service.js";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Missing Authorization header" });
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ message: "Invalid Authorization header" });

    const token = parts[1] as string;

    // Check Blacklist
    const isBlacklisted = await BlacklistedToken.exists({ token });
    if (isBlacklisted) {
      return res.status(401).json({ message: "Token has been revoked. Please login again." });
    }

    try {
      const payload = verifyAccessToken(token) as any;
      const user = await User.findById(payload.sub).select("-password -emailVerificationTokenHash -emailVerificationExpires");
      if (!user) return res.status(401).json({ message: "Invalid token: user not found" });
      (req as any).user = user;
      return next();
    } catch (error: any) {
      // Return 401 directly so frontend can trigger refresh flow
      return res.status(401).json({ message: "Token expired or invalid" });
    }

  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
