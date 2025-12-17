import type { Request, Response } from "express";
import Order from "../models/Order.js";
import { User } from "../models/User.js";
import Product from "../models/Product.js";

// Manager Analytics: Sales, Store Performance
export const getManagerAnalytics = async (req: Request, res: Response) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalRevenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });

        res.json({
            stats: {
                totalOrders,
                totalRevenue,
                lowStockProducts
            },
            role: "manager"
        });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch manager analytics", error: error.message });
    }
};

// Admin Analytics: User Growth, System Health (NOT Sales if strictly separated, but usually Admin sees all. 
// However, user requested "Admin should NOT have access to Manager-specific dashboard data... unless shared".
// We will mock "Admin System Data" here to show separation.
export const getAdminAnalytics = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const newUsersToday = await User.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        const totalTickets = 0; // Placeholder for Ticket model

        res.json({
            stats: {
                totalUsers,
                newUsersToday,
                activeSystem: true
            },
            role: "admin"
        });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch admin analytics", error: error.message });
    }
};
