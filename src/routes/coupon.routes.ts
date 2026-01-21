import { Router } from "express";
import * as couponController from "../controllers/coupon.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validateBody } from "../middlewares/zod.middleware.js";
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from "../validators/coupon.validators.js";

const router = Router();

router.get("/", authenticate, couponController.getAllCoupons);
router.post("/validate", authenticate, validateBody(validateCouponSchema), couponController.validateCoupon);

// Manager only
router.post("/", authenticate, authorize(["manager", "admin"]), validateBody(createCouponSchema), couponController.createCoupon);
router.put("/:id", authenticate, authorize(["manager", "admin"]), validateBody(updateCouponSchema), couponController.updateCoupon);
router.delete("/:id", authenticate, authorize(["manager", "admin"]), couponController.deleteCoupon);

export default router;
