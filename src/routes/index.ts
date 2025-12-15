// src/routes/index.ts
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import authRoutes from "./auth.routes.js";
import cartRoutes from "./cart.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import wishListRoutes from "./wishlist.routes.js";
import userRoutes from "./user.routes.js";
import orderRoutes from "./order.routes.js";
import supportRoutes from "./support.routes.js";
const router = Router();

// Auth Routes (cleanly separated)
router.use("/auth", authRoutes);

// Protected
router.use("/users", userRoutes); // Includes /users/me for profile management

// Feature routes
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishListRoutes);
router.use("/orders", orderRoutes);
router.use("/support", supportRoutes);
export default router;
