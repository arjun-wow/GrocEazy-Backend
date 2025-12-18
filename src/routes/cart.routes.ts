import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";
import {authenticate} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getCart);
router.post("/", authenticate, addToCart);

router.put("/:cartId", authenticate, updateCartItem);
router.delete("/:cartId", authenticate, removeCartItem);
router.delete("/", authenticate, clearCart);

export default router;
