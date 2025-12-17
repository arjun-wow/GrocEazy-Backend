import { Router } from "express";
import { getManagerAnalytics, getAdminAnalytics } from "../controllers/analytics.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authenticate);

// Strict Separation
// Admin cannot access Manager analytics
router.get("/manager", authorize(["manager"]), getManagerAnalytics);

// Manager cannot access Admin analytics
router.get("/admin", authorize(["admin"]), getAdminAnalytics);

export default router;
