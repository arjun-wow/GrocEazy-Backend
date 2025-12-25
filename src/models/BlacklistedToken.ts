import mongoose, { Schema, Document } from "mongoose";

export interface IBlacklistedToken extends Document {
    token: string;
    expiresAt: Date;
}

const BlacklistedTokenSchema: Schema = new Schema({
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
});

// TTL Index: Automatically remove documents after 'expiresAt'
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const BlacklistedToken = mongoose.model<IBlacklistedToken>("BlacklistedToken", BlacklistedTokenSchema);
