import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
});

export const createCouponSchema = z.object({
    code: z.string().trim().min(3, "Code must be at least 3 characters").uppercase(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(0, "Value cannot be negative"),
    minOrderAmount: z.number().min(0).optional(),
    maxDiscountAmount: z.number().min(0).optional(),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
    usageLimit: z.number().int().min(0).optional(),
    usageLimitPerUser: z.number().int().min(0).optional(),
    applicableCategories: z.array(z.string()).optional(),
    applicableProducts: z.array(z.string()).optional(),
    excludedProducts: z.array(z.string()).optional(),
    customerSegment: z.enum(["all", "new_users"]).optional(),
    stackable: z.boolean().optional(),
    autoApply: z.boolean().optional(),
    priority: z.number().int().optional(),
    platforms: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export const updateCouponSchema = createCouponSchema.partial().extend({
    isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
    code: z.string().trim().min(1, "Coupon code is required").uppercase(),
    cartTotal: z.number().min(0, "Cart total is required"),
    items: z.array(z.any()).optional(),
    platform: z.string().optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
