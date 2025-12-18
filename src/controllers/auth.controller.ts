// src/controllers/auth.controller.ts
import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { registerSchema, loginSchema, googleLoginSchema, setPasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";
import config from "../config/index.js";

import { sendEmail, getWelcomeEmail } from "../utils/email.util.js";

export async function register(req: Request, res: Response) {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });
  const { name, email, password } = parse.data;
  const { user, verificationToken } = await authService.registerUser({ name, email, password });

  // Send Welcome Email
  const { subject, text } = getWelcomeEmail(user.name);
  // Fire and forget email
  sendEmail(user.email, subject, text).catch(err => logger.error("Failed to send welcome email", err));

  // Provide verification link in email like: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&id=${user._id}`
  // For dev convenience we return token here — remove in prod.
  return res.status(201).json({ message: "Registered. Check email for verification.", userId: user._id });
}

export async function login(req: Request, res: Response) {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });

  // Ensure ip is always a string (avoid string | undefined)
  const ip = req.ip ?? "";
  const ua = req.get("User-Agent") || "";

  const { accessToken, refreshToken, user } = await authService.loginUser({
    email: parse.data.email,
    password: parse.data.password,
    ipAddress: ip,        // now always string
    userAgent: ua,
  });

  // guard for unexpected null user (minimal check)
  if (!user) return res.status(500).json({ message: "Login succeeded but user object missing" });

  // normalize sameSite to express-expected union type ("strict" | "lax" | "none")
  const sameSite =
    (String(config.cookie.sameSite || "strict").toLowerCase() as "strict" | "lax" | "none");

  // set refresh token cookie
  res.cookie(config.cookie.refreshTokenName, refreshToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite,
    maxAge: config.jwt.refreshTokenExpiresDays * 24 * 60 * 60 * 1000,
  });

  return res.json({
    accessToken,
    user: {
      id: user!._id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      phone: user!.phone || "",
      hasPassword: !!user!.password,
      isActive: !!user!.isActive,
      addresses: user!.addresses || []
    }
  });
}

export async function googleLogin(req: Request, res: Response) {
  const parse = googleLoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });

  const ip = req.ip ?? "";
  const ua = req.get("User-Agent") || "";

  const { accessToken, refreshToken, user } = await authService.loginOrRegisterGoogleUser(parse.data.token, ip, ua);

  // normalize sameSite to express-expected union type ("strict" | "lax" | "none")
  const sameSite =
    (String(config.cookie.sameSite || "strict").toLowerCase() as "strict" | "lax" | "none");

  // set refresh token cookie
  res.cookie(config.cookie.refreshTokenName, refreshToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite,
    maxAge: config.jwt.refreshTokenExpiresDays * 24 * 60 * 60 * 1000,
  });

  return res.json({
    accessToken,
    user: {
      id: user!._id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      phone: user!.phone || "",
      hasPassword: !!user!.password,
      isActive: !!user!.isActive,
      addresses: user!.addresses || []
    }
  });
}

export async function refresh(req: Request, res: Response) {
  const rawToken = req.cookies[config.cookie.refreshTokenName];
  if (!rawToken) return res.status(401).json({ message: "No refresh token" });
  const ip = req.ip ?? "";
  const ua = req.get("User-Agent") || "";
  const { accessToken, refreshToken, user } = await authService.rotateRefreshToken(rawToken, ip, ua);

  if (!user) return res.status(401).json({ message: "Invalid refresh flow: user missing" });

  const sameSite =
    (String(config.cookie.sameSite || "strict").toLowerCase() as "strict" | "lax" | "none");

  // set new cookie
  res.cookie(config.cookie.refreshTokenName, refreshToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite,
    maxAge: config.jwt.refreshTokenExpiresDays * 24 * 60 * 60 * 1000,
  });
  return res.json({
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      hasPassword: !!user.password,
      addresses: user.addresses || []
    }
  });
}

export async function logout(req: Request, res: Response) {
  const rawToken = req.cookies[config.cookie.refreshTokenName];
  if (rawToken) {
    await authService.logoutByRawToken(rawToken);
    res.clearCookie(config.cookie.refreshTokenName);
  }
  return res.json({ message: "Logged out" });
}

export async function verifyEmail(req: Request, res: Response) {
  const { id, token } = req.query as any;
  if (!id || !token) return res.status(400).json({ message: "Invalid request" });
  await authService.verifyEmail(id, token);
  return res.json({ message: "Email verified" });
}

export async function setPassword(req: Request, res: Response) {
  const parse = setPasswordSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });

  // req.user is populated by authenticate middleware (which we need to make sure is used in routes)
  // Assuming req.user.id exists.
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  await authService.setPassword(userId, parse.data.password);
  return res.json({ message: "Password updated successfully" });
}

export async function forgotPassword(req: Request, res: Response) {
  const parse = forgotPasswordSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });

  const result = await authService.forgotPassword(parse.data.email);
  if (result) {
    const { user, compositeToken } = result;
    // Send email with link
    // Link format: FRONTEND_URL/reset-password?token=...
    // Or /reset-password/<token>
    // Prompt said: POST /api/auth/reset-password/:token
    // Frontend likely has route /reset-password/:token

    // We need to construct the link.
    const link = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${encodeURIComponent(compositeToken)}`;

    // Use a generic email helper or create template?
    // Using simple text for now or update email util?
    // Let's use sendEmail with custom text.
    const subject = "Reset Your Password";
    const text = `Hello ${user.name},\n\nPlease click the link below to reset your password:\n\n${link}\n\nThis link expires in 1 hour.\n\nRegards,\nGrocEazy`;

    sendEmail(user.email, subject, text).catch(err => logger.error("Failed to send reset email", err));
  }

  // Always return success to prevent email enumeration
  return res.json({ message: "If email exists, a reset link has been sent." });
}

export async function resetPassword(req: Request, res: Response) {
  const { token } = req.params;
  const parse = resetPasswordSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });

  if (!token) return res.status(400).json({ message: "Token required" });

  await authService.resetPassword(token, parse.data.password);
  return res.json({ message: "Password reset successfully. You can now login with your new password." });
}
