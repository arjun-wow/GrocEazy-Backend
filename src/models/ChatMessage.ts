import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver?: mongoose.Types.ObjectId;
  message: string;
  room: string; // Typically the customer's ID
  isAdmin: boolean;
  isRead: boolean;
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      required: true,
      index: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
