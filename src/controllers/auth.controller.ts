// src/controllers/auth.controller.ts
import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { registerSchema, loginSchema, googleLoginSchema, refreshSchema, setPasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyOtpSchema, resendOtpSchema } from "../validators/auth.validator.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";
import config from "../config/index.js";

import { sendEmail, getWelcomeEmail, getOtpEmail } from "../utils/email.util.js";
import { signAccessToken } from "../utils/jwt.util.js";

export async function register(req: Request, res: Response) {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });
  const { name, email, password } = parse.data;
  const { user, otp } = await authService.registerUser({ name, email, password });

  // Send OTP Email
  const { subject, text } = getOtpEmail(otp);
  sendEmail(user.email, subject, text).catch(err => logger.error("Failed to send OTP email", err));

  return res.status(201).json({ message: "Registered. Check email for OTP.", userId: user._id, email: user.email });
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

  return res.json({
    accessToken,
    refreshToken,
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

  return res.json({
    accessToken,
    refreshToken,
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
  const parse = refreshSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: "Refresh token is required" });

  const rawToken = parse.data.refreshToken;

  // Blacklist old access token if present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const oldAccessToken = authHeader.split(" ")[1];
    if (oldAccessToken) {
      // fire and forget or await? Safer to await to ensure it's blacklisted before issuing new one
      await authService.blacklistAccessToken(oldAccessToken);
    }
  }

  const ip = req.ip ?? "";
  const ua = req.get("User-Agent") || "";
  const { accessToken, refreshToken, user } = await authService.rotateRefreshToken(rawToken, ip, ua);

  if (!user) return res.status(401).json({ message: "Invalid refresh flow: user missing" });

  return res.json({
    accessToken,
    refreshToken,
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
  const { refreshToken } = req.body;
  if (refreshToken) {
    await authService.logoutByRawToken(refreshToken);
  }

  // Blacklist access token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const accessToken = authHeader.split(" ")[1];
    if (accessToken) await authService.blacklistAccessToken(accessToken);
  }

  return res.json({ message: "Logged out" });
}

export async function verifyEmail(req: Request, res: Response) {
  // Legacy or URL based verification if needed, otherwise deprecate
  const { id, token } = req.query as any;
  if (!id || !token) return res.status(400).json({ message: "Invalid request" });
  // authService.verifyEmail(id, token); // We replaced/removed verifyEmail logic for OTP, but let's assume we want to keep it if we didn't remove it. 
  // actually we replaced verifyEmail signature in service file?
  // I replaced it with `verifyOtp` and `resendOtp`. So `verifyEmail` in service is GONE.
  // I should remove this controller function or update it to use verifyOtp if it was generic.
  // But usage suggests this endpoint was GET /verify-email?id=...&token=... 
  // I will deprecate this endpoint or remove it.
  return res.status(404).json({ message: "Use verify-otp endpoint" });
}

export async function verifyOtp(req: Request, res: Response) {
  const parse = verifyOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });

  const { email, otp } = parse.data;
  const user = await authService.verifyOtp(email, otp);

  // Auto login
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const ip = req.ip ?? "";
  const ua = req.get("User-Agent") || "";
  const { rawToken: refreshToken } = await authService.createRefreshTokenSession(user._id, ip, ua);

  return res.json({
    message: "Email verified successfully",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      hasPassword: !!user.password,
      isActive: !!user.isActive,
      addresses: user.addresses || []
    }
  });
}

export async function resendOtp(req: Request, res: Response) {
  const parse = resendOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });

  const { email } = parse.data;
  const { user, otp } = await authService.resendOtp(email);

  const { subject, text } = getOtpEmail(otp);
  sendEmail(user.email, subject, text).catch(err => logger.error("Failed to send OTP email", err));

  return res.json({ message: "OTP resent successfully" });
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
  const parse = resetPasswordSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: parse.error.flatten() });

  const { token, password } = parse.data;

  await authService.resetPassword(token, password);
  return res.json({ message: "Password reset successfully. You can now login with your new password." });
}
