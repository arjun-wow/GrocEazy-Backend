import mongoose from "mongoose";
import SupportTicket from "../models/SupportTicket.js";
import { User } from "../models/User.js";
import {
  sendEmail,
  getTicketCreatedEmail,
  getTicketAssignedEmail,
  getTicketStatusUpdateEmail,
  getTicketResolvedEmail,
} from "../utils/email.util.js";

class SupportService {
  static async createTicket(
    userId: string,
    subject: string,
    description: string
  ) {
    // Find manager with the least number of active tickets (open or in_progress)
    const managersWithTicketCounts = await User.aggregate([
      {
        $match: {
          role: "manager",
          isActive: true,
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "supporttickets",
          let: { managerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$assignedManagerId", "$$managerId"] },
                    { $in: ["$status", ["open", "in_progress"]] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "activeTickets",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          activeCount: { $size: "$activeTickets" },
        },
      },
      { $sort: { activeCount: 1, _id: 1 } },
      { $limit: 1 },
    ]);

    const manager = managersWithTicketCounts[0];

    if (!manager) {
      throw new Error("No manager available");
    }

    const ticket = await SupportTicket.create({
      userId,
      subject,
      description,
      assignedManagerId: manager._id,
    });

    // Increment manager's assigned tickets count
    await User.findByIdAndUpdate(manager._id, {
      $inc: { assignedTicketsCount: 1 },
    });

    const customer = await User.findById(userId);

    if (customer?.email) {
      const mail = getTicketCreatedEmail(
        customer.name,
        ticket._id.toString(),
        subject
      );
      sendEmail(customer.email, mail.subject, mail.text);
    }

    if (manager.email) {
      const mail = getTicketAssignedEmail(
        manager.name,
        ticket._id.toString()
      );
      sendEmail(manager.email, mail.subject, mail.text);
    }

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate({
        path: "userId",
        select: "_id name email",
      })
      .populate({
        path: "assignedManagerId",
        select: "_id name email assignedTicketsCount",
      })
      .lean();

    return this.formatTicket(populatedTicket, "customer");
  }

  static async getAllTickets(
    page = 1,
    limit = 10,
    role: "customer" | "manager" | "admin",
    userId: string,
    status?: string,
    dateFrom?: string,
    sortOrder: "newest" | "oldest" = "newest",
    managerId?: string,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const match: any = { isDeleted: false }; // Base match

    if (role === "customer") {
      match.userId = new mongoose.Types.ObjectId(userId);
    }

    if (role === "manager") {
      // Managers see tickets assigned to them
      match.assignedManagerId = new mongoose.Types.ObjectId(userId);
    }

    // Search logic
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        match._id = new mongoose.Types.ObjectId(search);
      } else {
        match.$or = [
          { subject: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
    }

    // Admin can filter by manager
    if (role === "admin" && managerId && managerId !== "all") {
      if (managerId === "unassigned") {
        match.assignedManagerId = null;
      } else if (managerId === "assigned") {
        match.assignedManagerId = { $ne: null };
      } else {
        match.assignedManagerId = new mongoose.Types.ObjectId(managerId);
      }
    }

    if (status && status !== "all") {
      match.status = status;
    }

    // Date filtering
    if (dateFrom) {
      match.createdAt = { $gte: new Date(dateFrom) };
    }

    // Determine sort direction
    const sortDirection = sortOrder === "oldest" ? 1 : -1;

    // Build stats match (without status filter to get all status counts)
    const statsMatch: any = { isDeleted: false };
    if (role === "customer") {
      statsMatch.userId = new mongoose.Types.ObjectId(userId);
    }
    if (role === "manager") {
      statsMatch.assignedManagerId = new mongoose.Types.ObjectId(userId);
    }

    if (managerId && managerId !== "all") {
      if (managerId === "unassigned") {
        statsMatch.assignedManagerId = null;
      } else if (managerId === "assigned") {
        statsMatch.assignedManagerId = { $ne: null };
      } else {
        statsMatch.assignedManagerId = new mongoose.Types.ObjectId(managerId);
      }
    }
    if (dateFrom) {
      statsMatch.createdAt = { $gte: new Date(dateFrom) };
    }

    let query = SupportTicket.find(match)
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean();

    if (role === "admin" || role === "manager" || role === "customer") {
      query = query
        .populate({
          path: "userId",
          select: "_id name email",
        })
        .populate({
          path: "assignedManagerId",
          select: "_id name email assignedTicketsCount",
        });
    }

    const [tickets, total, managers, statusCounts] = await Promise.all([
      query,
      SupportTicket.countDocuments(match),
      role === "admin"
        ? User.find({ role: "manager", isActive: true, isDeleted: false })
          .select("_id name email assignedTicketsCount")
          .lean()
        : Promise.resolve(undefined),
      // Aggregate status counts (respecting role and date filter, but not status filter)
      SupportTicket.aggregate([
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
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    statusCounts.forEach((item: { _id: string; count: number }) => {
      if (item._id in stats) {
        (stats as any)[item._id] = item.count;
      }
      stats.total += item.count;
    });

    return {
      tickets: tickets.map((ticket: any) =>
        this.formatTicket(ticket, role)
      ),
      managers: managers,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private static formatTicket(ticket: any, role: string) {
    return {
      _id: ticket._id,
      subject: ticket.subject,
      description: ticket.description,
      ticketdescription: ticket.description, // Added as alias per user request
      status: ticket.status,
      createdAt: ticket.createdAt,
      user: ticket.userId, // Included for all roles so customer can see their own info
      assignedManager: ticket.assignedManagerId, // Included for all roles
    };
  }


  static async updateStatus(ticketId: string, status: string) {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.status === "resolved") {
      throw new Error("Resolved ticket cannot be updated");
    }

    const oldStatus = ticket.status;
    ticket.status = status as any;
    await ticket.save();

    // Update manager's count if moving between active and inactive statuses
    const activeStatuses = ["open", "in_progress"];
    const inactiveStatuses = ["resolved", "closed"];

    if (
      ticket.assignedManagerId &&
      activeStatuses.includes(oldStatus) &&
      inactiveStatuses.includes(status)
    ) {
      await User.findByIdAndUpdate(ticket.assignedManagerId, {
        $inc: { assignedTicketsCount: -1 },
      });
    } else if (
      ticket.assignedManagerId &&
      inactiveStatuses.includes(oldStatus) &&
      activeStatuses.includes(status)
    ) {
      await User.findByIdAndUpdate(ticket.assignedManagerId, {
        $inc: { assignedTicketsCount: 1 },
      });
    }

    const customer = await User.findById(ticket.userId);
    const manager = ticket.assignedManagerId
      ? await User.findById(ticket.assignedManagerId)
      : null;

    if (customer?.email) {
      const mail = getTicketStatusUpdateEmail(
        customer.name,
        ticket._id.toString(),
        status
      );
      sendEmail(customer.email, mail.subject, mail.text);
    }

    if (status === "resolved") {
      if (customer?.email) {
        const mail = getTicketResolvedEmail(
          customer.name,
          ticket._id.toString()
        );
        sendEmail(customer.email, mail.subject, mail.text);
      }


    }

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate({
        path: "userId",
        select: "_id name email",
      })
      .populate({
        path: "assignedManagerId",
        select: "_id name email assignedTicketsCount",
      })
      .lean();

    return this.formatTicket(updatedTicket, "manager");
  }

  static async deleteTicket(ticketId: string) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    ticket.isDeleted = true;
    await ticket.save();

    // Decrement count if the ticket was active
    const activeStatuses = ["open", "in_progress"];
    if (ticket.assignedManagerId && activeStatuses.includes(ticket.status)) {
      await User.findByIdAndUpdate(ticket.assignedManagerId, {
        $inc: { assignedTicketsCount: -1 },
      });
    }
  }

  static async assignToManager(ticketId: string, managerId: string) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const manager = await User.findOne({
      _id: managerId,
      role: "manager",
      isActive: true,
      isDeleted: false,
    });

    if (!manager) {
      throw new Error("Manager not found or inactive");
    }

    const oldManagerId = ticket.assignedManagerId;
    const isActive = ["open", "in_progress"].includes(ticket.status);

    if (oldManagerId?.toString() === managerId) {
      const populatedTicket = await SupportTicket.findById(ticket._id)
        .populate({
          path: "userId",
          select: "_id name email",
        })
        .populate({
          path: "assignedManagerId",
          select: "_id name email assignedTicketsCount",
        })
        .lean();
      return this.formatTicket(populatedTicket, "admin");
    }

    ticket.assignedManagerId = manager._id as any;
    await ticket.save();

    if (isActive) {
      // Decrement from old manager if they existed
      if (oldManagerId) {
        await User.findByIdAndUpdate(oldManagerId, {
          $inc: { assignedTicketsCount: -1 },
        });
      }
      // Increment for new manager
      await User.findByIdAndUpdate(managerId, {
        $inc: { assignedTicketsCount: 1 },
      });
    }

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate({
        path: "userId",
        select: "_id name email",
      })
      .populate({
        path: "assignedManagerId",
        select: "_id name email assignedTicketsCount",
      })
      .lean();

    if (manager.email) {
      const mail = getTicketAssignedEmail(manager.name, ticket._id.toString());
      sendEmail(manager.email, mail.subject, mail.text);
    }

    return this.formatTicket(updatedTicket, "admin");
  }
}

export default SupportService;
