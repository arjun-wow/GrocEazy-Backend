import mongoose from 'mongoose';
import CartItem from '../models/Cart.js';
import Product from '../models/Product.js';

class CartService {
  /* ================= GET CART ================= */

  async getCart(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const result = await CartItem.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },

      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },

      {
        $match: {
          'product.isDeleted': false,
        },
      },

      {
        $addFields: {
          lineTotal: { $multiply: ['$quantity', '$product.price'] },
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
          items: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
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

  /* ================= ADD TO CART ================= */

  async addToCart(userId: string, productId: string, quantity: number) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findById(productId).session(session);

      if (!product || product.isDeleted || !product.isActive) {
        throw new Error('Product not available');
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

  /* ================= UPDATE CART QUANTITY ================= */

  async updateCartItemById(cartId: string, newQuantity: number) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cartItem = await CartItem.findById(cartId).session(session);
      if (!cartItem) throw new Error('Cart item not found');

      const product = await Product.findById(cartItem.productId).session(
        session
      );
      if (!product || product.isDeleted || !product.isActive) {
        throw new Error('Product no longer available');
      }

      const diff = newQuantity - cartItem.quantity;

      if (diff > 0 && product.stock < diff) {
        throw new Error(`Only ${product.stock} items available`);
      }

      await CartItem.findByIdAndUpdate(
        cartId,
        { quantity: newQuantity },
        { session }
      );

      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -diff } },
        { session }
      );

      await session.commitTransaction();
      return true;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /* ================= REMOVE CART ITEM ================= */

  async removeItemById(cartId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cartItem = await CartItem.findById(cartId).session(session);
      if (!cartItem) return;

      await Product.findByIdAndUpdate(
        cartItem.productId,
        { $inc: { stock: cartItem.quantity } },
        { session }
      );

      await CartItem.findByIdAndDelete(cartId, { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /* ================= CLEAR CART ================= */

  async clearCart(userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const items = await CartItem.find({ userId }).session(session);

      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      await CartItem.deleteMany({ userId }, { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

export default new CartService();
