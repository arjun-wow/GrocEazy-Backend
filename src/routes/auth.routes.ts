// src/routes/auth.routes.ts
import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Simple rate limiter for auth endpoints (tunable)
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000), // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX || 10),
  message: "Too many requests, please try again later."
});

router.post("/register", authLimiter, authCtrl.register);
router.post("/login", authLimiter, authCtrl.login);
router.post("/refresh", authCtrl.refresh); // cookie-protected
router.post("/logout", authCtrl.logout);

export default router;
