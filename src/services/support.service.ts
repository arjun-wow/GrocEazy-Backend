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
    }).sort({ assignedTicketsCount: 1 });

    if (!manager) {
      throw new Error("No manager available");
    }

    const ticket = await SupportTicket.create({
      userId,
      subject,
      description,
      assignedManagerId: manager._id,
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

    return ticket;
  }

  static async getAllTickets(
    userId: string,
    role: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    let match: any = { isDeleted: false };

    if (role === "customer") {
      match.userId = userId;
    }

    if (role === "manager") {
      match.assignedManagerId = userId;
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(match),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

    ticket.status = status as any;
    await ticket.save();

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

    return ticket;
  }

  static async deleteTicket(ticketId: string) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new Error("Ticket not found");

    ticket.isDeleted = true;
    await ticket.save();
  }
}

export default SupportService;
