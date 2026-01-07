// src/routes/auth.routes.ts
import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Simple rate limiter for auth endpoints (tunable)
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000), // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX || 10),
  message: "Too many requests, please try again later."
});

// Auth endpoints
router.post("/register", authLimiter, authCtrl.register);
router.post("/login", authLimiter, authCtrl.login);
router.post("/google", authLimiter, authCtrl.googleLogin);
router.post("/refresh", authCtrl.refresh); // no limit (refresh uses cookies)
router.post("/logout", authCtrl.logout);
router.get("/verify-email", authCtrl.verifyEmail);
router.post("/verify-otp", authLimiter, authCtrl.verifyOtp);
router.post("/resend-otp", authLimiter, authCtrl.resendOtp);
router.post("/set-password", authenticate, authLimiter, authCtrl.setPassword);
router.post("/forgot-password", authLimiter, authCtrl.forgotPassword);
router.post("/reset-password", authLimiter, authCtrl.resetPassword);

export default router;
