import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeWishlistItem,
  moveToCart,
} from "../controllers/wishlist.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../middlewares/zod.middleware.js";
import { addToWishlistSchema, wishlistIdParamSchema } from "../validators/wishlist.validators.js";

const router = Router();

router.get("/", authenticate, getWishlist);
router.post("/", authenticate, validateBody(addToWishlistSchema), addToWishlist);
router.delete("/:wishlistId", authenticate, validateParams(wishlistIdParamSchema), removeWishlistItem);

router.post("/:wishlistId/move-to-cart", authenticate, validateParams(wishlistIdParamSchema), moveToCart);

export default router;
