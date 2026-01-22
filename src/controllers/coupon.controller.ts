import type { RequestHandler } from "express";
import CouponService from "../services/coupon.service.js";
import { logger } from "../utils/logger.js";

export const createCoupon: RequestHandler = async (req, res) => {
    try {
        const createdBy = (req as any).user?._id;
        const coupon = await CouponService.createCoupon({ ...req.body, createdBy });
        res.status(201).json(coupon);
    } catch (error) {
        logger.error("Error creating coupon", error);
        res.status(500).json({ message: "Error creating coupon", error });
    }
};

export const getAllCoupons: RequestHandler = async (req, res) => {
    try {
        const user = (req as any).user;
        const isManager = user && ["manager", "admin"].includes(user.role);
        const coupons = await CouponService.getAllCoupons(isManager);
        res.status(200).json(coupons);
    } catch (error) {
        logger.error("Error fetching coupons", error);
        res.status(500).json({ message: "Error fetching coupons", error });
    }
};

export const validateCoupon: RequestHandler = async (req, res) => {
    try {
        const { code, cartTotal, items, platform } = req.body;
        const userId = (req as any).user?._id;
        const result = await CouponService.validateCoupon({
            code,
            cartTotal,
            userId,
            items,
            platform
        });
        res.status(200).json(result);
    } catch (error) {
        logger.error("Error validating coupon", error);
        res.status(500).json({ message: "Error validating coupon", error });
    }
};

export const updateCoupon: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: "Coupon ID is required" });
            return;
        }
        const coupon = await CouponService.updateCoupon(id as string, req.body);
        if (!coupon) {
            res.status(404).json({ message: "Coupon not found" });
            return;
        }
        res.status(200).json(coupon);
    } catch (error) {
        logger.error("Error updating coupon", error);
        res.status(500).json({ message: "Error updating coupon", error });
    }
};

export const deleteCoupon: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            res.status(400).json({ message: "Coupon ID is required" });
            return;
        }
        const coupon = await CouponService.deleteCoupon(id as string);
        if (!coupon) {
            res.status(404).json({ message: "Coupon not found" });
            return;
        }
        res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error) {
        logger.error("Error deleting coupon", error);
        res.status(500).json({ message: "Error deleting coupon", error });
    }
};
