import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleLoginSchema = z.object({
  token: z.string().min(1, "Google token is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const setPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long"),
  token: z.string().min(1, "Token is required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
});
