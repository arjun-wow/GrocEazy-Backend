import { Server, Socket } from 'socket.io';
import ChatMessage from '../models/ChatMessage.js';

export class SocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupListeners();
  }

  private setupListeners() {
    this.io.on('connection', (socket: Socket) => {
      console.log('User connected:', socket.id);

      socket.on('join_room', (room: string) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
        
        // Send a welcome message if it's a new room/session
        socket.emit('bot_message', {
          message: 'Hello! How can we help you today? A manager will be with you shortly.',
          timestamp: new Date()
        });
      });

      socket.on('send_message', async (data: { 
        room: string, 
        sender: string, 
        message: string, 
        isAdmin: boolean 
      }) => {
        try {
          const newMessage = await ChatMessage.create({
            sender: data.sender,
            message: data.message,
            room: data.room,
            isAdmin: data.isAdmin
          });

          // Broadcast to everyone in the room
          this.io.to(data.room).emit('receive_message', newMessage);

          // If it's a customer message, notify managers
          if (!data.isAdmin) {
            this.io.emit('new_notification', {
              type: 'chat',
              room: data.room,
              message: data.message,
              senderName: 'Customer', // In a real app, you'd fetch the user's name
              createdAt: newMessage.createdAt
            });
          }
        } catch (error) {
          console.error('Error saving message:', error);
        }
      });

      socket.on('mark_messages_read', async (room: string) => {
        try {
          await ChatMessage.updateMany(
            { room, isAdmin: false, isRead: false },
            { $set: { isRead: true } }
          );
          // Notify the room that messages are read
          this.io.to(room).emit('messages_marked_read', { room });
          // Also update global unread count for the manager who marked it
          socket.emit('unread_count_update');
        } catch (error) {
          console.error('Error marking messages read:', error);
        }
      });

      socket.on('typing', (data: { room: string, user: string, isTyping: boolean }) => {
        socket.to(data.room).emit('user_typing', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }
}
