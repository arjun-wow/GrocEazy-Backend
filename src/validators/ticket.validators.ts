import { z } from 'zod';

export const ticketIdParamSchema = z.object({
  ticketId: z.string().min(1, 'ticketId is required'),
});

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const assignManagerSchema = z.object({
  managerId: z.string().min(1, 'managerId is required'),
});
