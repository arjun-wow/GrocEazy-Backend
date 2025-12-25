import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

export const addWishlistSchema = z.object({
  productId: objectId,
});

export const wishlistIdSchema = z.object({
  wishlistId: objectId,
});

export const wishlistValidators = {
  addWishlistSchema,
  wishlistIdSchema,
};
