// src/models/RefreshToken.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  hashedToken: string; // hash of the token string
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  isRevoked: boolean;
  replacedByToken?: string | null; // id of new token
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  hashedToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  isRevoked: { type: Boolean, default: false },
  replacedByToken: { type: String, default: null },
});

export const RefreshToken = model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
