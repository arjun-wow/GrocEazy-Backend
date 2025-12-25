import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

export const addItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const cartIdSchema = z.object({
  cartId: objectId,
});

export const cartValidators = {
  addItemSchema,
  updateItemSchema,
  cartIdSchema,
};
