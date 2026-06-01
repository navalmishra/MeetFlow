export type ChatMessageRecord = {
  id: string;
  streamCallId: string;
  streamMessageId?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};
