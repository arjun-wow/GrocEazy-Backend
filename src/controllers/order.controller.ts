import type { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Helper to get user ID from request
const getUserId = (req: Request): mongoose.Types.ObjectId => {
    const user = req.user;
    if (!user || !user._id) {
        throw new Error("User ID missing from request");
    }
    return user._id as mongoose.Types.ObjectId;
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { address, items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "No items in order" });
        }

        let totalAmount = 0;
        const orderItems = [];

        // Process items: validate product, price, stock
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res
                    .status(404)
                    .json({ message: `Product not found: ${item.productId}` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for product: ${product.name}`,
                });
            }

            // Use price from database for security
            const unitPrice = product.price;
            const lineTotal = unitPrice * item.quantity;
            totalAmount += lineTotal;

            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                unitPrice,
                lineTotal,
            });
        }

        const newOrder = new Order({
            userId,
            address,
            items: orderItems,
            totalAmount,
            status: "Pending",
            paymentStatus: "Pending", // Default
        });

        const savedOrder = await newOrder.save();

        // Ideally, we should decrease stock here (implementation pending transaction/concurrency handling)

        res.status(201).json(savedOrder);
    } catch (error: any) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: "Failed to create order", error: error.message });
    }
};

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error: any) {
        res
            .status(500)
            .json({ message: "Failed to fetch orders", error: error.message });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Order ID" });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId,
        });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Populate product details if needed, for more info
        await order.populate("items.productId", "name images");

        res.json(order);
    } catch (error: any) {
        res
            .status(500)
            .json({ message: "Failed to fetch order", error: error.message });
    }
};

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Order ID" });
        }

        const order = await Order.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId,
        });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "Pending" && order.status !== "Processing") {
            return res
                .status(400)
                .json({ message: "Order cannot be cancelled in its current state" });
        }

        order.status = "Cancelled";
        await order.save();

        res.json({ message: "Order cancelled successfully", order });
    } catch (error: any) {
        res
            .status(500)
            .json({ message: "Failed to cancel order", error: error.message });
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const total = await Order.countDocuments();
        const orders = await Order.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            orders,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch all orders", error: error.message });
    }
};
