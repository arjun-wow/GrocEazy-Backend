import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

export const placeOrderSchema = z.object({
  address: z.object({
    fullName: z.string().min(1, "Full name is required"),
    line1: z.string().min(1, "Address line 1 is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    phone: z.string().min(1, "Phone number is required"),
  }),
  items: z.array(z.object({
    productId: objectId,
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    unitPrice: z.coerce.number().positive("Unit price must be positive"),
  })).min(1, "Order must contain at least 1 item"),
});

export const updateStatusSchema = z.object({
  status: z.enum(["Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Out for Delivery"]),
});

export const orderIdSchema = z.object({
  id: objectId,
});

export const orderValidators = {
  placeOrderSchema,
  updateStatusSchema,
  orderIdSchema,
};
