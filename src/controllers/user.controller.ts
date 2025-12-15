// src/controllers/user.controller.ts
import type { Request, Response } from "express";
import { User } from "../models/User.js";

export async function me(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user });
}

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: { name, phone } },
      { new: true }
    ).select("-password -emailVerificationTokenHash -emailVerificationExpires");

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const addressData = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If making this default, unset others
    if (addressData.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push(addressData);
    await user.save();

    res.json(user.addresses);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to add address", error: error.message });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { id } = req.params; // address id
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const addressIndex = user.addresses.findIndex((addr: any) => addr._id.toString() === id);
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (updates.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // Merge updates
    const currentAddr = (user.addresses[addressIndex] as any).toObject();
    user.addresses[addressIndex] = { ...currentAddr, ...updates, _id: currentAddr._id };

    await user.save();
    res.json(user.addresses);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update address", error: error.message });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses = user.addresses.filter((addr: any) => addr._id.toString() !== id);
    await user.save();

    res.json(user.addresses);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete address", error: error.message });
  }
};
