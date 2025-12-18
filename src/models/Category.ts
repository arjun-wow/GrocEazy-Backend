import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
    image?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        image: { type: String },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<ICategory>("Category", CategorySchema);
