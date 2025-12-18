import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

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
  orderController.changeOrderStatus
);

// Customer routes
router.post(
  "/",
  authorize(["customer"]),
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
  orderController.getOrderById
);

router.patch(
  "/:id/cancel",
  authorize(["customer"]),
  orderController.cancelOrder
);
export default router;