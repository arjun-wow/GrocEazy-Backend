import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
});

export const categoryIdSchema = z.object({
  id: objectId,
});

export const categoryValidators = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
};
