import type { Request, Response } from "express";
import type { AuthRequest } from "../types/AuthRequest.js";
import mongoose from "mongoose";
import * as orderService from "../services/order.service.js";
import { User } from "../models/User.js";
import Order from "../models/Order.js";
import {
  sendEmail,
  getOrderConfirmedEmail,
  getOrderStatusUpdateEmail,
  getOrderCancelledEmail,
} from "../utils/email.util.js";

/**
 * Helper to get userId safely
 */
const getUserId = (req: AuthRequest): string => {
  if (!req.user?._id) {
    throw new Error("User ID missing from request");
  }
  return req.user._id.toString();
};

/**
 * CREATE ORDER (Customer)
 */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const { address, items } = req.body;

    const order = await orderService.createOrder({ userId, address, items });

    if (req.user?.email) {
      const userName = req.user.name ?? "Customer";
      const email = getOrderConfirmedEmail(
        userName,
        order._id.toString(),
        order.totalAmount
      );

      sendEmail(req.user.email, email.subject, email.text).catch(console.error);
    }

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to create order",
    });
  }
};

/**
 * CHANGE ORDER STATUS (Manager)
 */
export const changeOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const order = await orderService.updateOrderStatus(id, status);

    // Email customer on shipment-related updates
    if (["Shipped", "Delivered", "Out for Delivery"].includes(status)) {
      const populatedOrder = await Order.findById(order._id).populate(
        "userId",
        "name email"
      );

      const user = populatedOrder?.userId as any;
      if (user?.email) {
        const email = getOrderStatusUpdateEmail(
          user.name ?? "Customer",
          order._id.toString(),
          status
        );
        sendEmail(user.email, email.subject, email.text).catch(console.error);
      }
    }

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message || "Failed to update order status",
    });
  }
};

/**
 * GET MY ORDERS
 */
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const status = req.query.status as string;

    const result = await orderService.getMyOrders(userId, page, limit, status);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET ORDER BY ID
 */
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await orderService.getOrderById(userId, id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * CANCEL ORDER
 */
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await orderService.cancelOrder(userId, id);

    const user = await User.findById(userId);
    if (user?.email) {
      const email = getOrderCancelledEmail(
        user.name ?? "Customer",
        order._id.toString()
      );
      sendEmail(user.email, email.subject, email.text).catch(console.error);
    }

    res.json({ message: "Order cancelled successfully", order });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


/**
 * GET ORDER STATS (Manager)
 */
export const getOrderStats = async (_req: Request, res: Response) => {
  try {
    const stats = await orderService.getOrderStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET ALL ORDERS (Manager)
 */
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string;
    const dateFrom = req.query.dateFrom as string;
    const sortOrder = (req.query.sortOrder as "newest" | "oldest") || "newest";
    const search = req.query.search as string;

    const result = await orderService.getAllOrders(
      page,
      limit,
      status,
      dateFrom,
      sortOrder,
      search
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
