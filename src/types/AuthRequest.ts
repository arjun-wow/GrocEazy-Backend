import type { Request } from "express";
import mongoose from "mongoose";

export interface AuthRequest extends Request {
  user?: {
    _id: mongoose.Types.ObjectId | string;
    role?: string;
    email?: string;
  };
}
