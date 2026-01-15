import type { Response } from "express";
import type { AuthRequest } from "../types/AuthRequest.js";
import SupportService from "../services/support.service.js";

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

export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const role = req.user!.role;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as string;
    const assignedManager = req.query.assignedManager as string;
    const dateFrom = req.query.dateFrom as string;
    const sortOrder = (req.query.sortOrder as "newest" | "oldest") || "newest";
    const search = req.query.search as string;

    const result = await SupportService.getAllTickets(
      page,
      limit,
      role,
      userId,
      status,
      dateFrom,
      sortOrder,
      assignedManager,
      search
    );

    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateTicketStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const ticketId = req.params.ticketId as string;
    const { status } = req.body;

    await SupportService.updateStatus(ticketId as string, status);

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

export const deleteTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticketId = req.params.ticketId as string;

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

export const assignManager = async (req: AuthRequest, res: Response) => {
  try {
    const ticketId = req.params.ticketId as string;
    const { managerId } = req.body;

    const ticket = await SupportService.assignToManager(
      ticketId as string,
      managerId
    );

    return res.json({
      success: true,
      message: "Ticket assigned successfully",
      ticket,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
