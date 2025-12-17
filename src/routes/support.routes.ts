import { Router } from 'express';
import {
  createTicket,
  getAllTickets,
  updateTicketStatus,
  // assignManager,
  deleteTicket,
} from '../controllers/support.controller.js';

import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validateBody, validateParams } from '../middlewares/zod.middleware.js';

import {
  ticketIdParamSchema,
  createTicketSchema,
  updateTicketStatusSchema,
  assignManagerSchema,
} from '../validators/ticket.validators.js';

const router = Router();


router.post(
  '/',
  authenticate,
  requireRole(['customer']),
  validateBody(createTicketSchema),
  createTicket
);

router.get(
  '/my',
  authenticate,
  requireRole(['customer']),
  getAllTickets
);


router.get(
  '/',
  authenticate,
  requireRole(['admin', 'manager']),
  getAllTickets
);

router.patch(
  '/:ticketId/status',
  authenticate,
  requireRole(['admin', 'manager']),
  validateParams(ticketIdParamSchema),
  validateBody(updateTicketStatusSchema),
  updateTicketStatus
);

// router.patch(
//   '/:ticketId/assign',
//   authenticate,
//   requireRole(['admin', 'manager']),
//   validateParams(ticketIdParamSchema),
//   validateBody(assignManagerSchema),
//   assignManager
// );

router.delete(
  '/:ticketId',
  authenticate,
  requireRole(['admin']),
  validateParams(ticketIdParamSchema),
  deleteTicket
);

export default router;
