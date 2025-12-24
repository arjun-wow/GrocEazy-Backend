import mongoose from 'mongoose';
import CartItem from '../models/Cart.js';
import Product from '../models/Product.js';

/* ================= TRANSACTION RETRY HELPER ================= */

async function withTransactionRetry<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
  retries = 3
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err: any) {
    await session.abortTransaction();

    if (
      retries > 0 &&
      err?.errorLabels?.includes('TransientTransactionError')
    ) {
      return withTransactionRetry(fn, retries - 1);
    }

    throw err;
  } finally {
    session.endSession();
  }
}

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

      { $match: { 'product.isDeleted': false } },

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

    const items = result[0]?.items ?? [];
    const total = result[0]?.totalCount[0]?.count ?? 0;

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
    return withTransactionRetry(async (session) => {
      const product = await Product.findOneAndUpdate(
        { _id: productId, isDeleted: false, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { session, new: true }
      );

      if (!product) {
        throw new Error('Product not available or insufficient stock');
      }

      const cartItem = await CartItem.findOneAndUpdate(
        { userId, productId },
        { $inc: { quantity } },
        { new: true, upsert: true, session }
      );

      return cartItem;
    });
  }

  /* ================= UPDATE CART ITEM ================= */

  async updateCartItemById(cartId: string, newQuantity: number) {
    return withTransactionRetry(async (session) => {
      const cartItem = await CartItem.findById(cartId).session(session);
      if (!cartItem) throw new Error('Cart item not found');

      const diff = newQuantity - cartItem.quantity;

      if (diff !== 0) {
        const product = await Product.findOneAndUpdate(
          {
            _id: cartItem.productId,
            isDeleted: false,
            isActive: true,
            ...(diff > 0 ? { stock: { $gte: diff } } : {}),
          },
          { $inc: { stock: -diff } },
          { session }
        );

        if (!product) {
          throw new Error('Insufficient stock');
        }
      }

      cartItem.quantity = newQuantity;
      await cartItem.save({ session });

      return true;
    });
  }

  /* ================= REMOVE CART ITEM ================= */

  async removeItemById(cartId: string) {
    return withTransactionRetry(async (session) => {
      const cartItem = await CartItem.findById(cartId).session(session);
      if (!cartItem) return;

      await Product.findByIdAndUpdate(
        cartItem.productId,
        { $inc: { stock: cartItem.quantity } },
        { session }
      );

      await CartItem.findByIdAndDelete(cartId, { session });
    });
  }

  /* ================= CLEAR CART ================= */

  async clearCart(userId: string) {
    return withTransactionRetry(async (session) => {
      const items = await CartItem.find({ userId }).session(session);

      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      await CartItem.deleteMany({ userId }, { session });
    });
  }
}

export default new CartService();
