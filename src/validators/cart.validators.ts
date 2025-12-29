import { z } from "zod";

export const cartIdParamSchema = z.object({
  cartId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Cart ID"),
});

export const addItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});
