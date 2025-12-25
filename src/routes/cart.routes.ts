import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";
import {authenticate} from "../middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../middlewares/zod.middleware.js";
import { cartIdSchema, addItemSchema, updateItemSchema } from "../validators/cart.validators.js";

const router = Router();

router.get("/", authenticate, getCart);
router.post("/", authenticate, validateBody(addItemSchema), addToCart);

router.put("/:cartId", authenticate, validateParams(cartIdSchema), validateBody(updateItemSchema), updateCartItem);
router.delete("/:cartId", authenticate, validateParams(cartIdSchema), removeCartItem);
router.delete("/", authenticate, clearCart);

export default router;
