import { Router } from "express";
import { createPaymentOrder, verifyPayment } from "../controllers/payment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-order", authenticate, createPaymentOrder);
router.get("/verify/:orderId", authenticate, verifyPayment);

export default router;
