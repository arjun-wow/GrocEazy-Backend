import { Router } from "express";
import { getAllProducts } from "../controllers/product.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authenticate);

// Shared Inventory View for Admin and Manager
router.get("/", authorize(["admin", "manager"]), getAllProducts);

export default router;
