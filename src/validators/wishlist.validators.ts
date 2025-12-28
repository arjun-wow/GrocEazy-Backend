import { z } from "zod";

export const wishlistIdParamSchema = z.object({
  wishlistId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Wishlist ID"),
});

export const addToWishlistSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
});
