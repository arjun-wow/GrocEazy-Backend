import Offer, { type IOffer } from "../models/Offer.js";
import type { CreateOfferInput, UpdateOfferInput } from "../validators/offer.validators.js";
import { decorateProductWithOffer } from "../utils/promoUtils.js";

class OfferService {
    async createOffer(data: CreateOfferInput & { createdBy: string }): Promise<IOffer> {
        const offer = new Offer(data);
        return await offer.save();
    }

    async getAllOffers(includeInactive: boolean = false): Promise<IOffer[]> {
        const query = includeInactive ? {} : { isActive: true };
        return await Offer.find(query)
            .populate('applicableProducts')
            .populate('applicableCategories')
            .sort({ createdAt: -1 });
    }

    async getActiveOffers(): Promise<IOffer[]> {
        const now = new Date();
        const offers = await Offer.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        })
            .populate('applicableProducts')
            .populate('applicableCategories')
            .lean();

        // Decorate nested products so they have onSale/discountPrice flags
        return offers.map((offer: any) => {
            if (offer.applicableProducts) {
                offer.applicableProducts = offer.applicableProducts.map((p: any) =>
                    decorateProductWithOffer(p, [offer])
                );
            }
            return offer;
        }) as unknown as IOffer[];
    }

    async updateOffer(id: string, data: UpdateOfferInput): Promise<IOffer | null> {
        return await Offer.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteOffer(id: string): Promise<IOffer | null> {
        return await Offer.findByIdAndDelete(id);
    }
}

export default new OfferService();
