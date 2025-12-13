import mongoose from 'mongoose';
import SupportTicket from '../models/SupportTicket.js';

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

  async getMyTickets(userId: string) {
    return SupportTicket.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedManagerId',
          foreignField: '_id',
          as: 'assignedManager',
        },
      },
      { $unwind: { path: '$assignedManager', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          subject: 1,
          description: 1,
          status: 1,
          createdAt: 1,
          assignedManager: {
            _id: 1,
            name: 1,
            email: 1,
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  }

  async getAllTickets() {
    return SupportTicket.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedManagerId',
          foreignField: '_id',
          as: 'assignedManager',
        },
      },
      { $unwind: { path: '$assignedManager', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          subject: 1,
          description: 1,
          status: 1,
          createdAt: 1,
          user: { _id: 1, name: 1, email: 1 },
          assignedManager: { _id: 1, name: 1 },
        },
      },
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
      { assignedManagerId: managerId, status: 'in_progress' },
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
