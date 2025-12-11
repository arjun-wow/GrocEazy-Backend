// src/validators/auth.validator.ts
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
