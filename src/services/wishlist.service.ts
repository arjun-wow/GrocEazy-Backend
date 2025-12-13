import mongoose from "mongoose";
import WishlistItem from "../models/Wishlist.js";
import type { ICartItem } from "../models/Cart.js";
import Product from "../models/Product.js";
import CartItem from "../models/Cart.js";

class WishlistService {
  async getWishlist(userId: string) {
    return WishlistItem.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      // Filter out deleted products
      {
        $match: {
          "product.isDeleted": false
        }
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          product: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            stock: 1,
            images: 1,
            size: 1,
            dietary: 1,
          },
        },
      },
    ]);
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) throw new Error("Product not available");

    return WishlistItem.findOneAndUpdate(
      { userId, productId },
      {},
      { upsert: true, new: true }
    );
  }

  async removeFromWishlist(wishlistId: string) {
    return WishlistItem.findByIdAndDelete(wishlistId);
  }

  /* ==========================================
        MOVE WISHLIST → CART
     ========================================== */
  async moveToCart(userId: string, wishlistId: string) {
    const wishlistItem = await WishlistItem.findById(wishlistId);

    if (!wishlistItem) throw new Error("Wishlist item not found");

    const productId = wishlistItem.productId.toString();

    // Add to cart (increment if exists)
    const cartItem = await CartItem.findOneAndUpdate(
      { userId, productId },
      { $inc: { quantity: 1 } },
      { upsert: true, new: true }
    );

    // Remove from wishlist
    await WishlistItem.findByIdAndDelete(wishlistId);

    return { cartItem };
  }
}

export default new WishlistService();
