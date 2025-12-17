import mongoose from "mongoose";
import SupportTicket from "../models/SupportTicket.js";
import { User } from "../models/User.js";

class SupportService {
  /**
   * CREATE TICKET WITH AUTO MANAGER ASSIGNMENT
   */
  async createTicket(
    userId: string,
    subject: string,
    description: string
  ) {
    // Get all active managers
    const managers = await User.find(
      { role: "manager", isDeleted: false },
      { _id: 1 }
    );

    let assignedManagerId: mongoose.Types.ObjectId | null = null;

    if (managers.length > 0) {
      // Count open & in-progress tickets per manager
      const ticketCounts = await SupportTicket.aggregate([
        {
          $match: {
            assignedManagerId: { $ne: null },
            status: { $in: ["open", "in_progress"] },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$assignedManagerId",
            count: { $sum: 1 },
          },
        },
      ]);

      const countMap = new Map<string, number>();
      ticketCounts.forEach((t) =>
        countMap.set(t._id.toString(), t.count)
      );

      // Pick manager with least tickets
      managers.sort((a, b) => {
        const aCount = countMap.get(a._id.toString()) ?? 0;
        const bCount = countMap.get(b._id.toString()) ?? 0;
        return aCount - bCount;
      });

      assignedManagerId = managers[0]._id;
    }

    return SupportTicket.create({
      userId,
      subject,
      description,
      assignedManagerId,
      status: assignedManagerId ? "in_progress" : "open",
    });
  }

  /**
   * GET TICKETS BASED ON ROLE
   */
  async getAllTickets(userId: string, role: string) {
    const match: any = { isDeleted: false };

    if (role === "manager") {
      match.assignedManagerId = new mongoose.Types.ObjectId(userId);
    }

    if (role === "customer") {
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

  /**
   * UPDATE STATUS
   * Resolved tickets cannot be changed again
   */
  async updateStatus(ticketId: string, status: string) {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) throw new Error("Ticket not found");

    if (ticket.status === "resolved") {
      throw new Error("Resolved ticket cannot be updated");
    }

    ticket.status = status;
    await ticket.save();
  }

  /**
   * SOFT DELETE
   */
  async deleteTicket(ticketId: string) {
    await SupportTicket.findByIdAndUpdate(ticketId, {
      isDeleted: true,
    });
  }
}

export default new SupportService();
