import type { Request, Response } from "express";
import mongoose from "mongoose";
import * as orderService from "../services/order.service.js";
import Order from "../models/Order.js";
// Helper to get user ID from request
const getUserId = (req: Request): string => {
    const user = (req as any).user;
    if (!user || !user._id) {
        throw new Error("User ID missing from request");
    }
    return user._id.toString();
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { address, items } = req.body;

        const order = await orderService.createOrder({ userId, address, items });

        res.status(201).json(order);
    } catch (error: any) {
        console.error("Create Order Error:", error);
        if (error.message.includes("not found") || error.message.includes("Insufficient stock")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to create order", error: error.message });
    }
};

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const orders = await orderService.getMyOrders(userId);
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const order = await orderService.getOrderById(userId, id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error: any) {
        if (error.message === "Invalid Order ID") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to fetch order", error: error.message });
    }
};

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;

        const order = await orderService.cancelOrder(userId, id);

        res.json({ message: "Order cancelled successfully", order });
    } catch (error: any) {
        if (error.message === "Order not found") {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === "Invalid Order ID" || error.message.includes("cannot be cancelled")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to cancel order", error: error.message });
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

export const fetchAllUsersOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await orderService.getAllOrders(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

export const changeOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(id, status);

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error: any) {
    if (
      error.message.includes("Invalid") ||
      error.message.includes("cannot")
    ) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};
