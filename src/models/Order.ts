import mongoose, { Schema, Document } from "mongoose";

export interface IAddress {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
}

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    address: IAddress;
    items: IOrderItem[];
    status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
    paymentStatus: "Pending" | "Paid" | "Failed";
    paymentMethod: "COD" | "Online";
    totalAmount: number;
    placedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
    {
        fullName: { type: String, required: true },
        line1: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        phone: { type: String, required: true },
    },
    { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        lineTotal: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const OrderSchema = new Schema<IOrder>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        address: { type: AddressSchema, required: true },
        items: { type: [OrderItemSchema], required: true },
        status: {
            type: String,
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        paymentMethod: {
            type: String,
            enum: ["COD", "Online"],
            default: "COD",
        },
        totalAmount: { type: Number, required: true, min: 0 },
        placedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
