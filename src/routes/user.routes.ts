import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

// Apply auth middleware to all user routes
router.use(authenticate);

// Public-ish (Authenticated User)
router.get("/me", userController.me);

// Admin Only Routes
const adminOnly = ["admin"];

router.get("/", authorize(adminOnly), userController.getAllUsers);
router.get("/:id", authorize(adminOnly), userController.getUserById);
router.patch("/:id/status", authorize(adminOnly), userController.updateUserStatus);

export default router;
