import type { Request, Response } from "express";
import Cashfree from "../config/cashfree.js";
import Order from "../models/Order.js";
import type { AuthRequest } from "../types/AuthRequest.js";
import mongoose from "mongoose";
import * as orderService from "../services/order.service.js"; // Reuse existing service


export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
             return res.status(401).json({ message: "User not authenticated" });
        }
       console.log("User ID:", userId);

        const { address, items, paymentMethod } = req.body;

        // 1. Create the order in "Pending" state in our DB
        // We reuse the service but we might need to handle the paymentMethod logic
        // For now, let's assume createOrder handles the basic DB entry.
        // We'll pass specific flag or just create it.
        // Actually, the service creates it with 'Pending' status which is fine.

        const order = await orderService.createOrder({ userId, address, items });

        if (paymentMethod === "COD") {
            // If COD, we are done
            return res.status(201).json(order);
        }

        // 2. If Online, initiate Cashfree Order
        const request = {
            order_amount: order.totalAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_name: address.fullName,
                customer_email: req.user?.email || "customer@example.com",
                customer_phone: address.phone,
            },
            order_meta: {
                return_url: `${process.env.CLIENT_URL}/checkout/success?order_id={order_id}`, // Helper return URL
            },
            order_id: order._id.toString(), // Sync IDs
        };

        const response = await Cashfree.PGCreateOrder(request);
        console.log("Cashfree Order Created:", response.data);
        
        // Update order with payment method
        order.paymentMethod = "Online";
        await order.save();

        res.status(201).json({
            ...order.toObject(),
            payment_session_id: response.data.payment_session_id,
            order_id: response.data.order_id
        });

    } catch (error: any) {
        console.error("Payment Order Creation Error:", error.message);
        if (error.response) {
            console.error("Cashfree API Response Status:", error.response.status);
            console.error("Cashfree API Response Data:", JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).json({ message: error.message || "Failed to initiate payment" });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        const response = await Cashfree.PGOrderFetchPayments(orderId);
        
        // Check if any transaction is successful
        const successfulTransaction = (response.data as any).find((tx: any) => tx.payment_status === "SUCCESS");

        if (successfulTransaction) {
             const order = await Order.findById(orderId);
             if(order) {
                 order.status = "Processing"; // Or whatever your workflow is
                 order.paymentStatus = "Paid";
                 await order.save();
                 return res.json({ status: "SUCCESS", order });
             }
        }
        
        res.json({ status: "PENDING", message: "Payment verification pending or failed" });

    } catch (error: any) {
        console.error("Verification Error:", error);
         res.status(500).json({ message: error.message });
    }
};
