import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { User } from "../models/User.js";
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

    try {
      const payload = verifyAccessToken(token) as any;
      const user = await User.findById(payload.sub).select("-password -emailVerificationTokenHash -emailVerificationExpires");
      if (!user) return res.status(401).json({ message: "Invalid token: user not found" });
      (req as any).user = user;
      return next();
    } catch (error: any) {
      // If token expired, try to separate seamlessly using Refresh Token
      if (error.name === "TokenExpiredError" || error.message === "jwt expired") {
        const refreshToken = req.cookies[config.cookie.refreshTokenName];
        if (!refreshToken) {
          return res.status(401).json({ message: "Token expired and no refresh token provided" });
        }

        try {
          // Attempt to rotate/refresh
          const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = await authService.rotateRefreshToken(refreshToken, req.ip, req.get("User-Agent"));

          // Set new cookie
          const sameSite = (String(config.cookie.sameSite || "strict").toLowerCase() as "strict" | "lax" | "none");
          res.cookie(config.cookie.refreshTokenName, newRefreshToken, {
            httpOnly: config.cookie.httpOnly,
            secure: config.cookie.secure,
            sameSite,
            maxAge: config.jwt.refreshTokenExpiresDays * 24 * 60 * 60 * 1000,
          });

          // Send new access token in header so client can update
          res.setHeader("x-access-token", newAccessToken);

          // Continue request with revived user
          (req as any).user = user;
          return next();
        } catch (refreshErr) {
          logger.warn("Seamless refresh failed:", refreshErr);
          return res.status(401).json({ message: "Session expired, please login again" });
        }
      }

      throw error; // Rethrow other errors
    }

  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
