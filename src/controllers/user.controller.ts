import type { Request, Response } from "express";
import { User } from "../models/User.js";

export async function me(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user });
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const role = req.query.role;
    const query: any = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password -emailVerificationTokenHash -emailVerificationExpires")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "-password -emailVerificationTokenHash -emailVerificationExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch user", error: error.message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, isDeleted } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof isActive === "boolean") user.isActive = isActive;
    if (typeof isDeleted === "boolean") user.isDeleted = isDeleted;

    await user.save();

    res.json({ message: "User status updated", user });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to update user status", error: error.message });
  }
};
