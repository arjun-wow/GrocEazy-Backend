// src/models/User.ts
import { Schema, model, Document } from "mongoose";

export interface Address {
  fullName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  fullName: String,
  line1: String,
  city: String,
  state: String,
  postalCode: String,
  phone: String,
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>({
  name: String,
  email: { type: String, unique: true, index: true },
  password: String,
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
}, { timestamps: true });

export const User = model<IUser>("User", UserSchema);
