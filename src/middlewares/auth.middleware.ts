// src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { User } from "../models/User.js";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Missing Authorization header" });
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ message: "Invalid Authorization header" });

    // after the above checks token is guaranteed to exist; assert to TS
    const token = parts[1] as string;

    const payload = verifyAccessToken(token) as any;
    const user = await User.findById(payload.sub).select("-password -emailVerificationTokenHash -emailVerificationExpires");
    if (!user) return res.status(401).json({ message: "Invalid token: user not found" });
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
