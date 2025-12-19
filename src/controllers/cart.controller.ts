import type { Response } from "express";
import CartService from "../services/cart.service.js";
import type { AuthRequest } from "../types/AuthRequest.js";

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await CartService.getCart(
      req.user._id.toString(),
      page,
      limit
    );

    return res.json({
      success: true,
      message: "Cart fetched successfully",
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { productId, quantity } = req.body;

    const item = await CartService.addToCart(
      req.user._id.toString(),
      productId,
      Number(quantity)
    );

    return res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      item,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { cartId } = req.params;
    const { quantity } = req.body;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    const updated = await CartService.updateCartItemById(cartId, Number(quantity));

    return res.json({
      success: true,
      message: "Cart item updated successfully",
      updated,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const removeCartItem = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { cartId } = req.params;

    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart ID is required",
      });
    }

    await CartService.removeItemById(cartId);

    return res.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await CartService.clearCart(req.user._id.toString());

    return res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
