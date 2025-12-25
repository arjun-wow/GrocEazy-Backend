import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validateBody, validateParams } from "../middlewares/zod.middleware.js";
import { placeOrderSchema, updateStatusSchema, orderIdSchema } from "../validators/orders.validators.js";

const router = Router();

router.use(authenticate);

router.get(
  "/all",
  authorize(["manager"]),
  orderController.getAllOrders
);

router.patch(
  "/:id/status",
  authorize(["manager"]),
  validateParams(orderIdSchema),
  validateBody(updateStatusSchema),
  orderController.changeOrderStatus
);

// Customer routes
router.post(
  "/",
  authorize(["customer"]),
  validateBody(placeOrderSchema),
  orderController.createOrder
);

router.get(
  "/",
  authorize(["customer"]),
  orderController.getMyOrders
);

router.get(
  "/:id",
  authorize(["customer"]),
  validateParams(orderIdSchema),
  orderController.getOrderById
);

router.patch(
  "/:id/cancel",
  authorize(["customer"]),
  validateParams(orderIdSchema),
  orderController.cancelOrder
);
export default router;