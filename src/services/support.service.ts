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
  // CREATE TICKET
  static async createTicket(
    userId: string,
    subject: string,
    description: string
  ) {
    // 1. Find least busy manager
    const manager = await User.findOne({
      role: "manager",
      isActive: true,
      isDeleted: false,
    }).sort({ assignedTicketsCount: 1 }); // optional metric

    if (!manager) {
      throw new Error("No manager available");
    }

    // 2. Create ticket
    const ticket = await SupportTicket.create({
      userId,
      subject,
      description,
      assignedManagerId: manager._id,
    });

    // 3. Fetch customer
    const customer = await User.findById(userId);

    // 4. Send emails (NON-BLOCKING)
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

  // GET TICKETS
  static async getAllTickets(userId: string, role: string) {
    if (role === "customer") {
      return SupportTicket.find({
        userId,
        isDeleted: false,
      }).sort({ createdAt: -1 });
    }

    if (role === "manager") {
      return SupportTicket.find({
        assignedManagerId: userId,
        isDeleted: false,
      }).sort({ createdAt: -1 });
    }

    return SupportTicket.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
  }

  // UPDATE STATUS
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

    // Fetch users
    const customer = await User.findById(ticket.userId);
    const manager = ticket.assignedManagerId
      ? await User.findById(ticket.assignedManagerId)
      : null;

    // Notify customer on any update
    if (customer?.email) {
      const mail = getTicketStatusUpdateEmail(
        customer.name,
        ticket._id.toString(),
        status
      );

      sendEmail(customer.email, mail.subject, mail.text);
    }

    // Notify both on resolved
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

  // DELETE (SOFT)
  static async deleteTicket(ticketId: string) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new Error("Ticket not found");

    ticket.isDeleted = true;
    await ticket.save();
  }
}

export default SupportService;
