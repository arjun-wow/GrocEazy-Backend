import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    name: string;
    description: string;
    size?: string;
    dietary?: string;
    stock: number;
    lowStockThreshold: number;
    price: number;
    discountPrice?: number;
    onSale: boolean;
    images: string[];
    isActive: boolean;
    categoryId: mongoose.Types.ObjectId;
    createdBy?: mongoose.Types.ObjectId; // Admin/Manager
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        size: { type: String },
        dietary: { type: String },
        stock: { type: Number, required: true, default: 0 },
        lowStockThreshold: { type: Number, default: 5 },
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        onSale: { type: Boolean, default: false },
        images: [{ type: String }],
        isActive: { type: Boolean, default: true },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Indexes for common queries
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isDeleted: 1 });
ProductSchema.index({ name: "text", description: "text" });

export default mongoose.model<IProduct>("Product", ProductSchema);
