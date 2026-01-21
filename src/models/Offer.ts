import mongoose, { Schema, Document } from "mongoose";

export interface IOffer extends Document {
    title: string;
    description: string;
    offerType: 'percentage' | 'fixed';
    discountValue?: number;
    customerSegment: 'all' | 'new_users';
    applicableCategories: mongoose.Types.ObjectId[];
    applicableProducts: mongoose.Types.ObjectId[];
    excludedProducts: mongoose.Types.ObjectId[];
    minPurchaseAmount: number;
    minPurchaseQuantity: number;
    usageLimitPerUser: number;
    marketing: {
        bannerImage?: string;
        pushText?: string;
        badgeLabel?: string;
        showCountdown: boolean;
    };
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
}

const OfferSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        offerType: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage'
        },
        discountValue: { type: Number },
        customerSegment: {
            type: String,
            enum: ['all', 'new_users'],
            default: 'all'
        },
        applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
        applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        minPurchaseAmount: { type: Number, default: 0 },
        minPurchaseQuantity: { type: Number, default: 0 },
        usageLimitPerUser: { type: Number, default: 0 }, // 0 = unlimited
        marketing: {
            bannerImage: { type: String },
            pushText: { type: String },
            badgeLabel: { type: String },
            showCountdown: { type: Boolean, default: false }
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IOffer>("Offer", OfferSchema);
