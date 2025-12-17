import type { Request } from "express";
import mongoose from "mongoose";

export interface JwtUser {
  _id: mongoose.Types.ObjectId | string;
  role: "customer" | "manager" | "admin";
  email?: string;
  name?: string;
}

export type AuthRequest = Omit<Request, "user"> & {
  user?: JwtUser;
};
