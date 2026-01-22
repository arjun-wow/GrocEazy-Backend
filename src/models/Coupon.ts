import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
    code: string;
    name: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    startDate: Date;
    endDate: Date;
    usageLimit: number;
    usageLimitPerUser: number;
    isActive: boolean;
    usedCount: number;
    applicableCategories: mongoose.Types.ObjectId[];
    applicableProducts: mongoose.Types.ObjectId[];
    excludedProducts: mongoose.Types.ObjectId[];
    customerSegment: 'all' | 'new_users';
    stackable: boolean;
    autoApply: boolean;
    priority: number;
    platforms: string[]; // ['web', 'android', 'ios']
}

const CouponSchema: Schema = new Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true },
        name: { type: String, required: true },
        description: { type: String },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true
        },
        discountValue: { type: Number, required: true }, // % or fixed amount
        minOrderAmount: { type: Number, default: 0 },
        maxDiscountAmount: { type: Number }, // Cap for % discount
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        usageLimit: { type: Number, default: 0 }, // Total usage limit
        usageLimitPerUser: { type: Number, default: 1 },
        isActive: { type: Boolean, default: true },
        usedCount: { type: Number, default: 0 },
        applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
        applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        customerSegment: { type: String, enum: ["all", "new_users"], default: "all" },
        stackable: { type: Boolean, default: false },
        autoApply: { type: Boolean, default: false },
        priority: { type: Number, default: 0 },
        platforms: { type: [String], default: ['web', 'android', 'ios'] }
    },
    { timestamps: true }
);

export default mongoose.model<ICoupon>("Coupon", CouponSchema);
