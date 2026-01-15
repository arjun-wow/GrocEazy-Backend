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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Fetch cart
    const cartItems = await CartItem.find({ userId }).session(session);

    if (!cartItems.length) {
      throw new Error("Cart is empty");
    }

    let totalAmount = 0;
    const orderItems: any[] = [];

    // 2️⃣ Check stock, decrement it, and build order items
    for (const item of cartItems) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          isDeleted: false,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      if (!product) {
        // Find product to get its name for a better error message
        const p = await Product.findById(item.productId).session(session);
        if (!p || p.isDeleted || !p.isActive) {
          throw new Error(`Product "${p?.name || item.productId}" is no longer available`);
        }
        throw new Error(
          `Product "${p.name}" has insufficient stock (Requested: ${item.quantity}, Available: ${p.stock})`
        );
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

      // ⚠️ LOW STOCK EMAIL (stock already reduced in this session)
      const threshold = (product as any).lowStockThreshold ?? 10;
      if (product.stock <= threshold) {
        const managers = await User.find({
          role: "manager",
          isActive: true,
        })
          .session(session)
          .select("email name");

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

    const savedOrder = await newOrder.save({ session });

    // 4️⃣ Clear cart
    await CartItem.deleteMany({ userId }, { session });

    await session.commitTransaction();
    return savedOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/* ================= GET MY ORDERS ================= */

export const getMyOrders = async (userId: string, page = 1, limit = 5, status?: string) => {
  const skip = (page - 1) * limit;
  const match: any = { userId };

  if (status && status !== "all") {
    match.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(match)
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      userId,
    }).session(session);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "Pending" && order.status !== "Processing") {
      throw new Error("Order cannot be cancelled in its current state");
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } },
        { session, new: true }
      );
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found during stock restoration`);
      }
    }

    order.status = "Cancelled";
    await order.save({ session });

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/* ================= GET ALL ORDERS ================= */

export const getAllOrders = async (
  page = 1,
  limit = 20,
  status?: string,
  dateFrom?: string,
  sortOrder: "newest" | "oldest" = "newest",
  search?: string,
  userId?: string
) => {
  const skip = (page - 1) * limit;

  const match: any = {};
  if (status && status !== "all") {
    match.status = status;
  }

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match.userId = new mongoose.Types.ObjectId(userId);
  }

  if (search) {
    if (mongoose.Types.ObjectId.isValid(search)) {
      match._id = new mongoose.Types.ObjectId(search);
    } else {
      match.$or = [
        { "address.fullName": { $regex: search, $options: "i" } },
        { "address.phone": { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
      ];
    }
  }

  // Date filtering
  if (dateFrom) {
    match.createdAt = { $gte: new Date(dateFrom) };
  }

  // Determine sort direction
  const sortDirection = sortOrder === "oldest" ? 1 : -1;

  // Build base match for stats (without status filter to get all status counts)
  const statsMatch: any = {};
  if (dateFrom) {
    statsMatch.createdAt = { $gte: new Date(dateFrom) };
  }

  const [orders, total, statusCounts] = await Promise.all([
    Order.find(match)
      .populate("userId", "name email")
      .populate({
        path: "items.productId",
        model: "Product",
        select: "name images price",
      })
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(match),
    // Aggregate status counts across all orders (respecting date filter only)
    Order.aggregate([
      { $match: statsMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Convert status counts array to object
  const stats = {
    total: 0,
    Pending: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  statusCounts.forEach((item: { _id: string; count: number }) => {
    if (item._id in stats) {
      (stats as any)[item._id] = item.count;
    }
    stats.total += item.count;
  });

  return {
    orders,
    stats,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
};



/* ================= GET ORDER STATS ================= */

export const getOrderStats = async () => {
  const statusCounts = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    total: 0,
    Pending: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  statusCounts.forEach((item: { _id: string; count: number }) => {
    if (item._id in stats) {
      (stats as any)[item._id] = item.count;
    }
    stats.total += item.count;
  });

  return stats;
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "Delivered") {
      throw new Error("Delivered order status cannot be changed");
    }

    const oldStatus = order.status;

    // 1️⃣ Moving TO Cancelled from an active status -> RESTORE STOCK
    if (status === "Cancelled" && oldStatus !== "Cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }
    }

    // 2️⃣ Moving FROM Cancelled to an active status -> DEDUCT STOCK (check availability)
    if (oldStatus === "Cancelled" && status !== "Cancelled") {
      for (const item of order.items) {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            isDeleted: false,
            isActive: true,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { session, new: true }
        );

        if (!product) {
          throw new Error(
            `Cannot revert cancellation: Product ${item.productId} is unavailable or has insufficient stock`
          );
        }
      }
    }

    order.status = status;
    await order.save({ session });

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
