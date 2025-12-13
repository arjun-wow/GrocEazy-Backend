import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem extends Document {
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

const CartItemSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
    },
    { timestamps: true }
);

// Avoid duplicate (user, product)
CartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model<ICartItem>("CartItem", CartItemSchema);
