import { StreamChat } from 'stream-chat';

import { getMeetingChannelId } from '@/lib/meeting-channel';

export { getMeetingChannelId };

let serverClient: StreamChat | null = null;

export function getStreamChatServerClient() {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim();
  const secret = process.env.STREAM_SECRET_KEY?.trim();

  if (!apiKey || !secret) {
    throw new Error('Stream API credentials are missing');
  }

  if (!serverClient) {
    serverClient = StreamChat.getInstance(apiKey, secret);
  }

  return serverClient;
}
