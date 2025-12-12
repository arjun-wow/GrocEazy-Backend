// src/routes/index.ts
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import authRoutes from "./auth.routes.js";

import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";

const router = Router();

// Auth Routes (cleanly separated)
router.use("/auth", authRoutes);

// Protected
router.get("/me", authenticate, userController.me);

// Feature routes
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);

export default router;
