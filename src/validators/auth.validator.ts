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
  // refresh will be read from cookie
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
