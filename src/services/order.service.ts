import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import CartItem from "../models/Cart.js";
import { User } from "../models/User.js";
import { sendEmail, getLowStockEmail } from "../utils/email.util.js";
import { logger } from "../utils/logger.js";

/* ================= TYPES ================= */

interface CreateOrderData {
  userId: string;
  address: any;
  items: { productId: string; quantity: number }[];
}

/* ================= CREATE ORDER ================= */

export const createOrder = async (data: CreateOrderData) => {
  const { userId, address } = data;

  // 1️⃣ Fetch cart (stock already reserved)
  const cartItems = await CartItem.find({ userId });

  if (!cartItems.length) {
    throw new Error("Cart is empty");
  }

  let totalAmount = 0;
  const orderItems: any[] = [];

  // 2️⃣ Build order items (NO STOCK CHECK)
  for (const item of cartItems) {
    const product = await Product.findById(item.productId);

    if (!product) {
      throw new Error("Product not found");
    }

    const unitPrice = product.price;
    const lineTotal = unitPrice * item.quantity;

    totalAmount += lineTotal;

    orderItems.push({
      productId: product._id,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    });

    // ⚠️ LOW STOCK EMAIL (safe here – stock already reduced)
    const threshold = (product as any).lowStockThreshold ?? 10;
    if (product.stock <= threshold) {
      const managers = await User.find({
        role: "manager",
        isActive: true,
      }).select("email name");

      const recipients = managers.map((m) => ({
        email: m.email,
        name: m.name,
      }));

      const adminEmail = process.env.ADMIN_EMAIL || "admin@groceazy.com";
      recipients.push({ email: adminEmail, name: "Admin" });

      const emailTemplate = getLowStockEmail(
        product.name,
        product.stock,
        product._id.toString()
      );

      sendEmail(recipients, emailTemplate.subject, emailTemplate.text).catch(
        (err) =>
          logger.error(
            `Failed to send low stock email for ${product.name}: ${err}`
          )
      );
    }
  }

  // 3️⃣ Create order
  const newOrder = new Order({
    userId,
    address,
    items: orderItems,
    totalAmount,
    status: "Pending",
    paymentStatus: "Pending",
  });

  const savedOrder = await newOrder.save();

  // 4️⃣ Clear cart (DO NOT restore stock)
  await CartItem.deleteMany({ userId });

  return savedOrder;
};

/* ================= GET MY ORDERS ================= */

export const getMyOrders = async (userId: string) => {
  return await Order.find({ userId }).sort({ createdAt: -1 });
};

/* ================= GET ORDER BY ID ================= */

export const getOrderById = async (userId: string, orderId: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid Order ID");
  }

  const order = await Order.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    userId,
  });

  if (!order) return null;

  await order.populate("items.productId", "name images");

  return order;
};

/* ================= CANCEL ORDER ================= */

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

  // ✅ Restore stock on cancel
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity },
    });
  }

  return order;
};

/* ================= GET ALL ORDERS ================= */

export const getAllOrders = async (page = 1, limit = 20) => {
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

/* ================= UPDATE ORDER STATUS ================= */

const ALLOWED_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

type OrderStatus = (typeof ALLOWED_STATUSES)[number];

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
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

  if (order.status === "Delivered") {
    throw new Error("Delivered order status cannot be changed");
  }

  order.status = status;
  await order.save();

  return order;
};
