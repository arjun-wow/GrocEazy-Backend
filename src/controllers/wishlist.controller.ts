import type { Response } from "express";
import type { AuthRequest } from "../types/AuthRequest.js";
import WishlistService from "../services/wishlist.service.js";

export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const wishlist = await WishlistService.getWishlist(req.user._id.toString());

    return res.json({
      success: true,
      message: "Wishlist fetched successfully",
      wishlist,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { productId } = req.body;

    const item = await WishlistService.addToWishlist(
      req.user._id.toString(),
      productId
    );

    return res.status(201).json({
      success: true,
      message: "Added to wishlist",
      item,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const removeWishlistItem = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { wishlistId } = req.params;

    if (!wishlistId) {
      return res.status(400).json({
        success: false,
        message: "Wishlist ID is required",
      });
    }

    await WishlistService.removeFromWishlist(wishlistId);

    return res.json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/* ================================
    MOVE WISHLIST ITEM → CART
================================ */
export const moveToCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { wishlistId } = req.params;

    if (!wishlistId) {
      return res.status(400).json({
        success: false,
        message: "Wishlist ID is required",
      });
    }

    const result = await WishlistService.moveToCart(
      req.user._id.toString(),
      wishlistId
    );

    return res.json({
      success: true,
      message: "Item moved to cart successfully",
      result,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
