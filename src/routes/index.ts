// src/routes/index.ts
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/ratelimit.middleware.js";

const router = Router();

// Auth routes
router.post("/auth/register", authRateLimiter, authController.register);
// router.post("/auth/login", authRateLimiter, authController.login);
// router.post("/auth/google", authRateLimiter, authController.googleLogin);
// router.post("/auth/refresh", authRateLimiter, authController.refresh); 
// Temporary disable rate limit for dev
router.post("/auth/login", authController.login);
router.post("/auth/google", authController.googleLogin);
router.post("/auth/refresh", authController.refresh); // cookie-based
router.post("/auth/logout", authController.logout);
router.get("/auth/verify-email", authController.verifyEmail);

// Protected
router.get("/me", authenticate, userController.me);

export default router;
