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

export const getCategoriesQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

export const categoryValidators = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  getCategoriesQuerySchema,
};
