// src/models/User.ts
import { Schema, model, Document } from "mongoose";

export interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string; // Added phone
  password?: string;
  googleId?: string;
  authProvider: "local" | "google";
  role: "customer" | "manager" | "admin";
  isActive?: boolean;
  addresses: Address[];
  isDeleted?: boolean;
  emailVerified?: boolean;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
  resetPasswordTokenHash?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, required: true },
  phone: { type: String }, // Added phone
  password: { type: String },
  googleId: String,
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  role: { type: String, enum: ["customer", "manager", "admin"], default: "customer" },
  isActive: { type: Boolean, default: true },
  addresses: [AddressSchema],
  isDeleted: { type: Boolean, default: false },
  // Email verification fields added per your choice
  emailVerified: { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  resetPasswordTokenHash: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
}, { timestamps: true });

export const User = model<IUser>("User", UserSchema);
