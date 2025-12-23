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
    const manager = await User.findOne({
      role: "manager",
      isActive: true,
      isDeleted: false,
    }).sort({ assignedTicketsCount: 1, _id: 1 });

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
    userId: string,
    role: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    const match: any = { isDeleted: false };

    if (role === "customer") {
      match.userId = userId;
    }

    if (role === "manager") {
      match.assignedManagerId = userId;
    }

    let query = SupportTicket.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (role !== "customer") {
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

    const [tickets, total, managers] = await Promise.all([
      query,
      SupportTicket.countDocuments(match),
      role === "admin"
        ? User.find({ role: "manager", isActive: true, isDeleted: false })
            .select("_id name email assignedTicketsCount")
            .lean()
        : Promise.resolve(undefined),
    ]);

    return {
      tickets: tickets.map((ticket: any) =>
        this.formatTicket(ticket, role)
      ),
      managers: managers,
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
      status: ticket.status,
      createdAt: ticket.createdAt,
      user: role !== "customer" ? ticket.userId : undefined,
      assignedManager:
        role !== "customer" ? ticket.assignedManagerId : undefined,
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

      if (manager?.email) {
        const mail = getTicketResolvedEmail(
          manager.name,
          ticket._id.toString()
        );
        sendEmail(manager.email, mail.subject, mail.text);
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
