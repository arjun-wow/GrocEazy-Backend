import type { IOffer } from "../models/Offer.js";

export function decorateProductWithOffer(product: any, activeOffers: IOffer[]) {
    const productWithOffer = {
        ...product,
        onSale: false,
        discountPrice: undefined
    };

    const productIdStr = (product._id || product).toString();
    const categoryIdStr = (product.categoryId?._id || product.categoryId)?.toString();

    const applicableOffers = activeOffers.filter(offer => {
        const isExcluded = offer.excludedProducts?.some(id => (id as any).toString() === productIdStr);
        if (isExcluded) return false;

        const isDirectProduct = offer.applicableProducts?.some(id => (id as any).toString() === productIdStr);
        if (isDirectProduct) return true;

        const isDirectCategory = offer.applicableCategories?.some(id => (id as any).toString() === categoryIdStr);
        if (isDirectCategory) return true;

        return false;
    });

    if (applicableOffers.length > 0) {
        const bestOffer = [...applicableOffers].sort((a: any, b: any) => {
            const getVal = (offer: any) => {
                if (offer.offerType === 'percentage') return offer.discountValue || 0;
                if (offer.offerType === 'fixed') return ((offer.discountValue || 0) / product.price) * 100;
                return 0;
            };

            return getVal(b) - getVal(a);
        })[0];

        if (bestOffer) {
            if (bestOffer.offerType === 'percentage' || bestOffer.offerType === 'fixed') {
                productWithOffer.onSale = true;
                const dVal = bestOffer.discountValue || 0;
                const discount = bestOffer.offerType === 'percentage'
                    ? (product.price * dVal) / 100
                    : dVal;
                productWithOffer.discountPrice = Math.round(product.price - discount);
            }
        }
    }

    // Fallback to product's own onSale if no offer overrides it
    if (!productWithOffer.onSale && product.onSale) {
        productWithOffer.onSale = true;
        productWithOffer.discountPrice = product.discountPrice;
    }

    return productWithOffer;
}
