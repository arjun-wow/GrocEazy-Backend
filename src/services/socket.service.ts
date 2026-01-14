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
        } catch (error) {
          console.error('Error saving message:', error);
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
