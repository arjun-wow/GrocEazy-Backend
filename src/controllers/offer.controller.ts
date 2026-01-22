import type { RequestHandler } from "express";
import OfferService from "../services/offer.service.js";
import { logger } from "../utils/logger.js";

export const createOffer: RequestHandler = async (req, res) => {
    try {
        const createdBy = (req as any).user?._id;
        const offer = await OfferService.createOffer({ ...req.body, createdBy });
        res.status(201).json(offer);
    } catch (error) {
        logger.error("Error creating offer", error);
        res.status(500).json({ message: "Error creating offer", error });
    }
};

export const getAllOffers: RequestHandler = async (req, res) => {
    try {
        const user = (req as any).user;
        const isManager = user && ["manager", "admin"].includes(user.role);
        const offers = await OfferService.getAllOffers(isManager);
        res.status(200).json(offers);
    } catch (error) {
        logger.error("Error fetching offers", error);
        res.status(500).json({ message: "Error fetching offers", error });
    }
};

export const getActiveOffers: RequestHandler = async (_req, res) => {
    try {
        const offers = await OfferService.getActiveOffers();
        res.status(200).json(offers);
    } catch (error) {
        logger.error("Error fetching active offers", error);
        res.status(500).json({ message: "Error fetching active offers", error });
    }
};

export const updateOffer: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: "Offer ID is required" });
            return;
        }
        const offer = await OfferService.updateOffer(id as string, req.body);
        if (!offer) {
            res.status(404).json({ message: "Offer not found" });
            return;
        }
        res.status(200).json(offer);
    } catch (error) {
        logger.error("Error updating offer", error);
        res.status(500).json({ message: "Error updating offer", error });
    }
};

export const deleteOffer: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: "Offer ID is required" });
            return;
        }
        const offer = await OfferService.deleteOffer(id as string);
        if (!offer) {
            res.status(404).json({ message: "Offer not found" });
            return;
        }
        res.status(200).json({ message: "Offer deleted successfully" });
    } catch (error) {
        logger.error("Error deleting offer", error);
        res.status(500).json({ message: "Error deleting offer", error });
    }
};
