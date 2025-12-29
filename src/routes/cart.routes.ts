import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../middlewares/zod.middleware.js";
import { addItemSchema, updateItemSchema, cartIdParamSchema } from "../validators/cart.validators.js";

const router = Router();

router.get("/", authenticate, getCart);
router.post("/", authenticate, validateBody(addItemSchema), addToCart);

router.put("/:cartId", authenticate, validateParams(cartIdParamSchema), validateBody(updateItemSchema), updateCartItem);
router.delete("/:cartId", authenticate, validateParams(cartIdParamSchema), removeCartItem);
router.delete("/", authenticate, clearCart);

export default router;
