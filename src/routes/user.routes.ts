import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

// Apply auth middleware to all user routes
router.use(authenticate);

// Public-ish (Authenticated User)
router.get("/me", userController.me);

// Admin / Manager Routes
const adminManager = ["admin", "manager"];

router.get("/", authorize(adminManager), userController.getAllUsers);
router.get("/:id", authorize(adminManager), userController.getUserById);
router.patch("/:id/status", authorize(adminManager), userController.updateUserStatus);

export default router;
