import type { Response } from "express";
import type { AuthRequest } from "../types/AuthRequest.js";
import SupportService from "../services/support.service.js";

/**
 * CREATE TICKET (Customer)
 * Auto assigns manager with least tickets
 */
export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, description } = req.body;

    const ticket = await SupportService.createTicket(
      req.user!._id.toString(),
      subject,
      description
    );

    return res.status(201).json({
      success: true,
      message: "Support ticket created",
      ticket,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET TICKETS (Admin / Manager / Customer)
 */
export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const role = req.user!.role;

    const tickets = await SupportService.getAllTickets(userId, role);

    return res.json({
      success: true,
      tickets,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * UPDATE STATUS (Manager / Admin)
 * Once resolved → cannot change again
 */
export const updateTicketStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    await SupportService.updateStatus(ticketId, status);

    return res.json({
      success: true,
      message: "Ticket status updated",
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * DELETE TICKET (Soft delete)
 */
export const deleteTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.params;

    await SupportService.deleteTicket(ticketId);

    return res.json({
      success: true,
      message: "Ticket deleted",
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
