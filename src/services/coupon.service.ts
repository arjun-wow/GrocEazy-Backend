import mongoose from "mongoose";
import Coupon, { type ICoupon } from "../models/Coupon.js";
import type { CreateCouponInput, UpdateCouponInput } from "../validators/coupon.validators.js";

class CouponService {
    async createCoupon(data: CreateCouponInput & { createdBy: string }): Promise<ICoupon> {
        const coupon = new Coupon(data);
        return await coupon.save();
    }

    async getAllCoupons(includeInactive: boolean = false): Promise<ICoupon[]> {
        const query = includeInactive ? {} : { isActive: true };
        return await Coupon.find(query).sort({ createdAt: -1 });
    }

    async getCouponByCode(code: string): Promise<ICoupon | null> {
        return await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    }

    async validateCoupon(params: {
        code: string;
        cartTotal: number;
        userId?: string;
        items?: any[]; // Array of { productId, categoryId, price, quantity }
        platform?: string;
    }): Promise<{ valid: boolean; discountAmount: number; message?: string; giftProductId?: any }> {
        const { code, cartTotal, userId, items, platform } = params;
        const coupon = await this.getCouponByCode(code);

        if (!coupon) {
            return { valid: false, discountAmount: 0, message: "Invalid or expired coupon code" };
        }

        if (!coupon.isActive) {
            return { valid: false, discountAmount: 0, message: "This coupon is currently inactive" };
        }

        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            return { valid: false, discountAmount: 0, message: "Coupon has expired" };
        }

        // 1. Total Usage Limit
        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return { valid: false, discountAmount: 0, message: "Coupon total usage limit reached" };
        }

        // 2. Per User Usage Limit
        if (userId) {

            // 3. Customer Segmentation
            if (coupon.customerSegment === "new_users") {
                const Order = mongoose.model("Order");
                const orderCount = await Order.countDocuments({ userId, status: { $ne: "Cancelled" } });
                if (orderCount > 0) {
                    return { valid: false, discountAmount: 0, message: "This coupon is only for new users" };
                }
            }
        }

        // 4. Platform check
        if (platform && coupon.platforms && coupon.platforms.length > 0) {
            if (!coupon.platforms.includes(platform.toLowerCase())) {
                return { valid: false, discountAmount: 0, message: `This coupon is not valid on ${platform}` };
            }
        }

        // 5. Min Order Amount
        if (cartTotal < coupon.minOrderAmount) {
            return { valid: false, discountAmount: 0, message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}` };
        }

        // 6. Applicability (Categories/Products)
        let eligibleAmount = cartTotal;
        if (items && items.length > 0 && (coupon.applicableCategories.length > 0 || coupon.applicableProducts.length > 0 || coupon.excludedProducts.length > 0)) {
            const eligibleItems = items.filter(item => {
                const isExcluded = coupon.excludedProducts.some(id => id.toString() === item.productId.toString());
                if (isExcluded) return false;

                const hasApplicableProduct = coupon.applicableProducts.length === 0 ||
                    coupon.applicableProducts.some(id => id.toString() === item.productId.toString());

                const hasApplicableCategory = coupon.applicableCategories.length === 0 ||
                    coupon.applicableCategories.some(id => id.toString() === item.categoryId.toString());

                return hasApplicableProduct && hasApplicableCategory;
            });

            if (eligibleItems.length === 0) {
                return { valid: false, discountAmount: 0, message: "None of the items in your cart are eligible for this coupon" };
            }

            eligibleAmount = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        // 7. Calculate Discount
        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
            const discount = (eligibleAmount * coupon.discountValue) / 100;
            discountAmount = coupon.maxDiscountAmount ? Math.min(discount, coupon.maxDiscountAmount) : discount;
        } else if (coupon.discountType === "fixed") {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed cart total
        discountAmount = Math.min(discountAmount, cartTotal);

        return { valid: true, discountAmount };
    }

    async updateCoupon(id: string, data: UpdateCouponInput): Promise<ICoupon | null> {
        return await Coupon.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteCoupon(id: string): Promise<ICoupon | null> {
        return await Coupon.findByIdAndDelete(id);
    }

    async incrementUsedCount(code: string, userId?: string): Promise<void> {
        await Coupon.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
    }
}

export default new CouponService();
