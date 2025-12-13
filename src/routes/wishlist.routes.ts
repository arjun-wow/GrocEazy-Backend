import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeWishlistItem,
  moveToCart,
} from "../controllers/wishlist.controller.js";
import {authenticate} from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getWishlist);
router.post("/", authenticate, addToWishlist);
router.delete("/:wishlistId", authenticate, removeWishlistItem);

router.post("/:wishlistId/move-to-cart", authenticate, moveToCart);

export default router;
