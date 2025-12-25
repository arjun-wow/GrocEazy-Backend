import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeWishlistItem,
  moveToCart,
} from "../controllers/wishlist.controller.js";
import {authenticate} from "../middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../middlewares/zod.middleware.js";
import { addWishlistSchema, wishlistIdSchema } from "../validators/wishlist.validators.js";

const router = Router();

router.get("/", authenticate, getWishlist);
router.post("/", authenticate, validateBody(addWishlistSchema), addToWishlist);
router.delete("/:wishlistId", authenticate, validateParams(wishlistIdSchema), removeWishlistItem);

router.post("/:wishlistId/move-to-cart", authenticate, validateParams(wishlistIdSchema), moveToCart);

export default router;
