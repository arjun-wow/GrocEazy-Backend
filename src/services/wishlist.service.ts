import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import CartItem from "../models/Cart.js";
import Product from "../models/Product.js";

class WishlistService {
  /* ================= GET WISHLIST ================= */

  async getWishlist(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const result = await Wishlist.aggregate([
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

      {
        $match: {
          "product.isDeleted": false,
        },
      },

      {
        $project: {
          _id: 1,
          productId: 1,
          createdAt: 1,
          product: {
            _id: 1,
            name: 1,
            images: 1,
            price: 1,
            stock: 1,
            isActive: 1,
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
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ================= ADD TO WISHLIST ================= */

  async addToWishlist(userId: string, productId: string) {
    const exists = await Wishlist.findOne({ userId, productId });
    if (exists) {
      throw new Error("Product already in wishlist");
    }

    return Wishlist.create({ userId, productId });
  }

  /* ================= REMOVE FROM WISHLIST ================= */

  async removeFromWishlist(wishlistId: string) {
    return Wishlist.findByIdAndDelete(wishlistId);
  }

  /* ================= MOVE TO CART ================= */

  async moveToCart(userId: string, wishlistId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wishlistItem = await Wishlist.findOne({
        _id: wishlistId,
        userId,
      }).session(session);

      if (!wishlistItem) {
        throw new Error("Wishlist item not found");
      }

      const product = await Product.findById(wishlistItem.productId).session(
        session
      );

      if (!product || product.isDeleted || !product.isActive) {
        throw new Error("Product not available");
      }

      // 🚫 Critical fix: prevent zero-stock move
      if (product.stock < 1) {
        throw new Error("Product is out of stock");
      }

      // ✅ Add exactly 1 quantity to cart
      await CartItem.findOneAndUpdate(
        { userId, productId: product._id },
        { $inc: { quantity: 1 } },
        { upsert: true, session }
      );

      // ✅ Reserve stock
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -1 } },
        { session }
      );

      // ✅ Remove from wishlist
      await Wishlist.findByIdAndDelete(wishlistId, { session });

      await session.commitTransaction();

      return { productId: product._id };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

export default new WishlistService();
