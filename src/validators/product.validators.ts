import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  description: z.string().trim().min(1, "Description is required"),
  size: z.string().trim().optional(),
  dietary: z.string().trim().optional(),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  categoryId: objectId,
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  size: z.string().trim().optional(),
  dietary: z.string().trim().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().positive().optional(),
  categoryId: objectId.optional(),
  isActive: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
});

export const productIdSchema = z.object({
  id: objectId,
});

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  categoryId: objectId.optional(),
  category: objectId.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().trim().optional(),
  dietary: z.string().trim().optional(),
  isActive: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  stockStatus: z.enum(['inStock', 'lowStock', 'outOfStock']).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'featured']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;

export const productValidators = {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  getProductsQuerySchema,
};
