import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply auth middleware
router.use(authenticate);

// Profile
router.get("/me", userController.me);
router.patch("/me", userController.updateProfile);

// Addresses
router.post("/me/addresses", userController.addAddress);
router.patch("/me/addresses/:id", userController.updateAddress);
router.delete("/me/addresses/:id", userController.deleteAddress);

export default router;
