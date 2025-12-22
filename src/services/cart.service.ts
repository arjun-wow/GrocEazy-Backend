import mongoose from "mongoose";
import CartItem from "../models/Cart.js";
import type { ICartItem } from "../models/Cart.js";
import Product from "../models/Product.js";

class CartService {

  /** GET CART USING AGGREGATION */
  async getCart(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const result = await CartItem.aggregate([
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
      $addFields: {
        lineTotal: { $multiply: ["$quantity", "$product.price"] },
      },
    },

    {
      $project: {
        _id: 1,
        productId: 1,
        quantity: 1,
        lineTotal: 1,
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
        items: [
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [
          { $count: "count" },
        ],
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


  /** ADD ITEM OR INCREMENT */
  async addToCart(userId: string, productId: string, quantity: number) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);

    if (!product || product.isDeleted || !product.isActive) {
      throw new Error("Product not available");
    }

    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} items available`);
    }

    const cartItem = await CartItem.findOneAndUpdate(
      { userId, productId },
      { $inc: { quantity } },
      { new: true, upsert: true, session }
    );

    await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: -quantity } },
      { session }
    );

    await session.commitTransaction();
    return cartItem;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}


  /** UPDATE QUANTITY USING cartId */
  async updateCartItemById(cartId: string, quantity: number) {
    const cartItem = await CartItem.findById(cartId);
    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    const product = await Product.findById(cartItem.productId);
    if (!product || product.isDeleted || !product.isActive) {
      throw new Error("Product no longer available");
    }

    if (quantity > product.stock) {
      throw new Error(`Only ${product.stock} items available in stock`);
    }

    return CartItem.findByIdAndUpdate(
      cartId,
      { quantity },
      { new: true }
    );
  }

  /** REMOVE ITEM USING cartId */
  async removeItemById(cartId: string) {
    return CartItem.findByIdAndDelete(cartId);
  }

  /** CLEAR CART */
  async clearCart(userId: string) {
    return CartItem.deleteMany({ userId });
  }
}

export default new CartService();
