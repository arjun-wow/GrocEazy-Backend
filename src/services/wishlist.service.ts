import mongoose from "mongoose";
import WishlistItem from "../models/Wishlist.js";
import Product from "../models/Product.js";
import CartItem from "../models/Cart.js";

class WishlistService {
  async getWishlist(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const result = await WishlistItem.aggregate([
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
      { $match: { "product.isDeleted": false } },
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
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const items = result[0].items;
    const total = result[0].totalCount[0]?.count || 0;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      throw new Error("Product not available");
    }

    return WishlistItem.findOneAndUpdate(
      { userId, productId },
      {},
      { upsert: true, new: true }
    );
  }

  async removeFromWishlist(wishlistId: string) {
    return WishlistItem.findByIdAndDelete(wishlistId);
  }

  async moveToCart(userId: string, wishlistId: string) {
    const wishlistItem = await WishlistItem.findById(wishlistId);
    if (!wishlistItem) {
      throw new Error("Wishlist item not found");
    }

    const productId = wishlistItem.productId.toString();

    const cartItem = await CartItem.findOneAndUpdate(
      { userId, productId },
      { $inc: { quantity: 1 } },
      { upsert: true, new: true }
    );

    await WishlistItem.findByIdAndDelete(wishlistId);

    return { cartItem };
  }
}

export default new WishlistService();
