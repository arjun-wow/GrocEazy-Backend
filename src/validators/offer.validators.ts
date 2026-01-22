import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
});

export const createOfferSchema = z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters"),
    description: z.string().trim().optional(),
    offerType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().nonnegative().optional(),
    customerSegment: z.enum(['all', 'new_users']),
    applicableCategories: z.array(objectId).optional(),
    applicableProducts: z.array(objectId).optional(),
    excludedProducts: z.array(objectId).optional(),
    minPurchaseAmount: z.number().nonnegative().optional(),
    minPurchaseQuantity: z.number().int().nonnegative().optional(),
    usageLimitPerUser: z.number().int().nonnegative().optional(),
    maxDiscountAmount: z.number().nonnegative().optional(),
    autoApply: z.boolean().optional(),
    stackable: z.boolean().optional(),
    couponCode: z.string().optional(),
    marketing: z.object({
        bannerImage: z.string().optional().or(z.literal("")),
        pushText: z.string().optional(),
        badgeLabel: z.string().optional(),
        showCountdown: z.boolean().optional(),
    }).optional(),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
    isActive: z.boolean().optional(),
});

export const updateOfferSchema = createOfferSchema.partial();

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
