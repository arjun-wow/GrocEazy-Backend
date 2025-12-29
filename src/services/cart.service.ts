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
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
      isActive: true,
    });

    if (!product) {
      throw new Error('Product not available');
    }

    const cartItem = await CartItem.findOneAndUpdate(
      { userId, productId },
      { $inc: { quantity } },
      { new: true, upsert: true }
    );

    return cartItem;
  }

  /* ================= UPDATE CART ITEM ================= */

  async updateCartItemById(cartId: string, newQuantity: number) {
    const cartItem = await CartItem.findByIdAndUpdate(
      cartId,
      { quantity: newQuantity },
      { new: true }
    );
    if (!cartItem) throw new Error('Cart item not found');
    return true;
  }

  /* ================= REMOVE CART ITEM ================= */

  async removeItemById(cartId: string) {
    await CartItem.findByIdAndDelete(cartId);
  }

  /* ================= CLEAR CART ================= */

  async clearCart(userId: string) {
    await CartItem.deleteMany({ userId });
  }
}

export default new CartService();
