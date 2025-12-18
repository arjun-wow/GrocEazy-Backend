import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

interface CreateOrderData {
    userId: string;
    address: any;
    items: { productId: string; quantity: number }[];
}

export const createOrder = async (data: CreateOrderData) => {
    const { userId, address, items } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("No items in order");
    }

    let totalAmount = 0;
    const orderItems = [];

    // Process items: validate product, price, stock
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product: ${product.name}`);
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
        paymentStatus: "Pending",
    });

    const savedOrder = await newOrder.save();

    // Ideally, we should decrease stock here (implementation pending transaction/concurrency handling)

    return savedOrder;
};

export const getMyOrders = async (userId: string) => {
    return await Order.find({ userId }).sort({ createdAt: -1 });
};

export const getOrderById = async (userId: string, orderId: string) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error("Invalid Order ID");
    }

    const order = await Order.findOne({
        _id: new mongoose.Types.ObjectId(orderId),
        userId,
    });

    if (!order) {
        return null; // Let controller handle 404
    }

    // Populate product details
    await order.populate("items.productId", "name images");

    return order;
};

export const cancelOrder = async (userId: string, orderId: string) => {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error("Invalid Order ID");
    }

    const order = await Order.findOne({
        _id: new mongoose.Types.ObjectId(orderId),
        userId,
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.status !== "Pending" && order.status !== "Processing") {
        throw new Error("Order cannot be cancelled in its current state");
    }

    order.status = "Cancelled";
    await order.save();

    return order;
};

export const getAllOrders = async (
  page = 1,
  limit = 20
) => {
  const skip = (page - 1) * limit;

  const total = await Order.countDocuments();

  const orders = await Order.find()
    .populate("userId", "name email")
    .populate({
      path: "items.productId",
      model: "Product",
      select: "name images price",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    orders,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};



const ALLOWED_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export const updateOrderStatus = async (
  orderId: string,
  status: string
) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid Order ID");
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error("Invalid order status");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  // Prevent undoing delivered orders
  if (order.status === "Delivered") {
    throw new Error("Delivered order status cannot be changed");
  }

  order.status = status;
  await order.save();

  return order;
};
