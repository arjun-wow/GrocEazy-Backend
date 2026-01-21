import mongoose from 'mongoose';
import CartItem from '../models/Cart.js';
import Product from '../models/Product.js';


import OfferService from "./offer.service.js";
import { decorateProductWithOffer } from "../utils/promoUtils.js";

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
            categoryId: 1,
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

    // Decorate items with offers and recalculate totals
    const activeOffers = await OfferService.getActiveOffers();
    const decoratedItems = items.map((item: any) => {
      const productWithOffer = decorateProductWithOffer(item.product, activeOffers);
      let lineTotal = item.quantity * productWithOffer.price;
      let finalPrice = productWithOffer.price;

      // Calculate Percentage/Fixed discount on line total
      if (productWithOffer.onSale && productWithOffer.discountPrice) {
        finalPrice = productWithOffer.discountPrice;
        lineTotal = item.quantity * finalPrice;
      }

      return {
        ...item,
        product: productWithOffer,
        lineTotal: lineTotal
      };
    });

    // Recalculate cart total based on discounted line totals
    const cartTotal = decoratedItems.reduce((sum: number, item: any) => sum + item.lineTotal, 0);

    return {
      items: decoratedItems,
      cartTotal, // Return explicit total
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
    let quantityToAdd = quantity;
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
      { $inc: { quantity: quantityToAdd } },
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
