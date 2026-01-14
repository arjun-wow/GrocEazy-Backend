import { Router } from 'express';
import ChatMessage from '../models/ChatMessage.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get chat history for a room
router.get('/history/:room', authenticate, async (req: any, res) => {
  try {
    const room = req.params.room as string;
    const messages = await ChatMessage.find({ room })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

// Get all active chat rooms (for managers)
router.get('/rooms', authenticate, async (req: any, res) => {
  try {
    // Only managers/admins should see all rooms
    if (req.user?.role === 'customer') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const rooms = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$room',
          lastMessage: { $first: '$message' },
          lastTimestamp: { $first: '$createdAt' },
          unreadCount: { 
            $sum: { 
              $cond: [{ $and: [{ $eq: ['$isAdmin', false] }] }, 1, 0] 
            } 
          }
        }
      },
      {
        $addFields: {
          userId: { $toObjectId: "$_id" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastTimestamp: 1,
          unreadCount: 1,
          userName: '$userDetails.name',
          userEmail: '$userDetails.email'
        }
      },
      { $sort: { lastTimestamp: -1 } }
    ]);

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat rooms' });
  }
});

export default router;
