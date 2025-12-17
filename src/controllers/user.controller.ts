import type { Request, Response } from "express";
import { User } from "../models/User.js";
import * as userService from "../services/user.service.js";
import { sendEmail, getAccountStatusEmail } from "../utils/email.util.js";

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

    // Send Account Status Email if active status changed (implicit check, ideally check dirty)
    // Here we just send if isActive was part of the body
    if (typeof isActive === "boolean") {
      const { subject, text } = getAccountStatusEmail(user.name, isActive);
      sendEmail(user.email, subject, text).catch(err => console.error("Failed to send account status email", err));
    }

    res.json({ message: "User status updated", user });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update user status", error: error.message });
  }
};

// --- Profile & Address Management ---

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const user = await userService.getProfile(userId);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { name, phone } = req.body;
    const updatedUser = await userService.updateProfile(userId, { name, phone });
    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: "Failed to update profile", error: error.message });
  }
};

export const addUserAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { street, city, state, zipCode, country, isDefault } = req.body;

    // Basic validation
    if (!street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    const updatedUser = await userService.addAddress(userId, { street, city, state, zipCode, country, isDefault });
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to add address", error: error.message });
  }
};

export const updateUserAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { addressId } = req.params;
    const addressData = req.body;

    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required" });
    }

    const updatedUser = await userService.updateAddress(userId, addressId, addressData);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update address", error: error.message });
  }
};

export const deleteUserAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { addressId } = req.params;

    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required" });
    }

    const updatedUser = await userService.deleteAddress(userId, addressId);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete address", error: error.message });
  }
};
