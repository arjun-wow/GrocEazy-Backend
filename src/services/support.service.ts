import mongoose from "mongoose";
import SupportTicket from "../models/SupportTicket.js";

class SupportService {
  async createTicket(
    userId: string,
    subject: string,
    description: string
  ) {
    return SupportTicket.create({
      userId,
      subject,
      description,
    });
  }

  async getAllTickets(userId: string, role: string) {
    const match: any = { isDeleted: false };

    if (role === "manager") {
      match.assignedManagerId = new mongoose.Types.ObjectId(userId);
    } else if (role === "customer") {
      match.userId = new mongoose.Types.ObjectId(userId);
    }

    return SupportTicket.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "users",
          localField: "assignedManagerId",
          foreignField: "_id",
          as: "assignedManager",
        },
      },
      {
        $unwind: {
          path: "$assignedManager",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          subject: 1,
          description: 1,
          status: 1,
          createdAt: 1,
          user: { _id: 1, name: 1, email: 1 },
          assignedManager: { _id: 1, name: 1, email: 1 },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  }

  async updateStatus(ticketId: string, status: string) {
    return SupportTicket.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    );
  }

  async assignManager(ticketId: string, managerId: string) {
    return SupportTicket.findByIdAndUpdate(
      ticketId,
      {
        assignedManagerId: managerId,
        status: "in_progress",
      },
      { new: true }
    );
  }

  async deleteTicket(ticketId: string) {
    return SupportTicket.findByIdAndUpdate(ticketId, {
      isDeleted: true,
    });
  }
}

export default new SupportService();
