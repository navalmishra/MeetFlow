'use server';

import { currentUser } from '@clerk/nextjs/server';

import { tryConnectToDatabase } from '@/lib/mongodb';
import {
  getMeetingChannelId,
  getStreamChatServerClient,
} from '@/lib/stream-chat-server';
import { ensureMeetingChatPermissions } from '@/lib/stream-chat-permissions';
import {
  MEETING_CHANNEL_TYPE,
  STREAM_CHAT_CHANNEL_CREATOR_ID,
} from '@/lib/meeting-channel';
import ChatMessage from '@/models/ChatMessage';
import type { ChatMessageRecord } from '@/types/chat';

async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

function serializeMessage(doc: {
  _id: { toString: () => string };
  streamCallId: string;
  streamMessageId?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}): ChatMessageRecord {
  return {
    id: doc._id.toString(),
    streamCallId: doc.streamCallId,
    streamMessageId: doc.streamMessageId,
    userId: doc.userId,
    userName: doc.userName,
    text: doc.text,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function upsertChatUser(user: Awaited<ReturnType<typeof requireUser>>) {
  const client = getStreamChatServerClient();
  const displayName = user.username || user.firstName || 'User';

  await client.upsertUser({
    id: user.id,
    name: displayName,
    image: user.imageUrl,
  });

  return displayName;
}

/** Admin user used as created_by_id for server-side channel create (not meeting participants). */
async function ensureStreamChannelCreator(
  client: ReturnType<typeof getStreamChatServerClient>
) {
  await client.upsertUser({
    id: STREAM_CHAT_CHANNEL_CREATOR_ID,
    name: 'MeetFlow',
    role: 'admin',
  });
}

export async function getChatToken(): Promise<string> {
  const user = await requireUser();
  await ensureMeetingChatPermissions();
  const client = getStreamChatServerClient();

  await upsertChatUser(user);

  return client.createToken(user.id);
}

/**
 * Server-side: create meeting channel (if needed) and add the current user as a member.
 * Must run before the client calls channel.watch().
 */
export async function joinMeetingChat(streamCallId: string) {
  const user = await requireUser();
  await ensureMeetingChatPermissions();
  const client = getStreamChatServerClient();
  const channelId = getMeetingChannelId(streamCallId);

  await upsertChatUser(user);
  await ensureStreamChannelCreator(client);

  // created_by_id must be set on channel data for server-side auth (not only in create()).
  const channel = client.channel(MEETING_CHANNEL_TYPE, channelId, {
    created_by_id: STREAM_CHAT_CHANNEL_CREATOR_ID,
  });

  try {
    await channel.create();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('already exists')) {
      throw error;
    }
  }

  try {
    await channel.addMembers([
      {
        user_id: user.id,
        channel_role: 'channel_member',
      },
    ]);
  } catch {
    // Already a member.
  }

  return { channelId, channelType: MEETING_CHANNEL_TYPE };
}

export async function getChatHistory(
  streamCallId: string,
  limit = 100
): Promise<ChatMessageRecord[]> {
  await requireUser();
  if (!(await tryConnectToDatabase())) return [];

  const messages = await ChatMessage.find({ streamCallId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  return messages.map((doc) =>
    serializeMessage({
      ...doc,
      _id: { toString: () => String(doc._id) },
      createdAt: doc.createdAt,
    })
  );
}

export async function saveChatMessage(input: {
  streamCallId: string;
  streamMessageId?: string;
  userId: string;
  userName: string;
  text: string;
}): Promise<ChatMessageRecord | null> {
  await requireUser();
  if (!(await tryConnectToDatabase())) return null;

  const text = input.text.trim();
  if (!text) throw new Error('Message cannot be empty');

  try {
    if (input.streamMessageId) {
      const existing = await ChatMessage.findOne({
        streamMessageId: input.streamMessageId,
      });
      if (existing) return serializeMessage(existing);
    }

    const message = await ChatMessage.create({
      streamCallId: input.streamCallId,
      streamMessageId: input.streamMessageId,
      userId: input.userId,
      userName: input.userName,
      text,
    });

    return serializeMessage(message);
  } catch (error) {
    console.error('saveChatMessage failed:', error);
    return null;
  }
}
