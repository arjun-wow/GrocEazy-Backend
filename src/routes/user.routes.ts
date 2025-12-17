import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

// Apply auth middleware
router.use(authenticate);

// Profile
router.get("/me", userController.me);
router.patch("/me", userController.updateProfile);

// Profile and Address Management
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateMyProfile);
router.post("/address", userController.addUserAddress);
router.put("/address/:addressId", userController.updateUserAddress);
router.delete("/address/:addressId", userController.deleteUserAddress);

// Admin / Manager Routes
const adminManager = ["admin", "manager"];

router.get("/", authorize(adminManager), userController.getAllUsers);
router.get("/:id", authorize(adminManager), userController.getUserById);
router.patch("/:id/status", authorize(adminManager), userController.updateUserStatus);

export default router;
