import { Schema, model, models } from 'mongoose';

export interface IChatMessage {
  streamCallId: string;
  streamMessageId?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    streamCallId: { type: String, required: true, index: true },
    streamMessageId: { type: String, sparse: true, unique: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ChatMessageSchema.index({ streamCallId: 1, createdAt: 1 });

export const ChatMessage =
  models.ChatMessage || model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
