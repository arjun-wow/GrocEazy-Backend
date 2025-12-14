import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply auth middleware to all order routes
router.use(authenticate);

router.post("/", orderController.createOrder);
router.get("/", orderController.getMyOrders);
router.get("/:id", orderController.getOrderById);
router.patch("/:id/cancel", orderController.cancelOrder);

export default router;
