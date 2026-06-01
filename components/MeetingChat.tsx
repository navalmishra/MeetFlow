'use client';

import { useUser } from '@clerk/nextjs';
import { MessageSquare, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StreamChat, type Channel, type Event } from 'stream-chat';

import {
  getChatHistory,
  getChatToken,
  joinMeetingChat,
  saveChatMessage,
} from '@/actions/chat.actions';
import { getMeetingChannelId } from '@/lib/meeting-channel';
import { MEETING_CHANNEL_TYPE } from '@/lib/meeting-channel';
import type { ChatMessageRecord } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Loader from './Loader';

type MeetingChatProps = {
  streamCallId: string;
  isOpen: boolean;
  onClose: () => void;
};

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim();

function sortMessages(messages: ChatMessageRecord[]) {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function mergeMessage(
  prev: ChatMessageRecord[],
  incoming: ChatMessageRecord
): ChatMessageRecord[] {
  if (
    prev.some(
      (m) =>
        m.id === incoming.id ||
        (incoming.streamMessageId &&
          m.streamMessageId === incoming.streamMessageId)
    )
  ) {
    return prev;
  }
  return sortMessages([...prev, incoming]);
}

export default function MeetingChat({
  streamCallId,
  isOpen,
  onClose,
}: MeetingChatProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [input, setInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const channelRef = useRef<Channel | null>(null);
  const clientRef = useRef<StreamChat | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleIncoming = useCallback(
    async (event: Event) => {
      const msg = event.message;
      if (!msg?.text || !msg.user?.id) return;

      try {
        const saved = await saveChatMessage({
          streamCallId,
          streamMessageId: msg.id,
          userId: msg.user.id,
          userName: msg.user.name || 'Participant',
          text: msg.text,
        });
        if (saved) {
          setMessages((prev) => mergeMessage(prev, saved));
        }
      } catch {
        // Ignore duplicate or transient save errors; Stream still delivered the message.
      }
    },
    [streamCallId]
  );

  useEffect(() => {
    if (!isOpen || !user || !API_KEY) return;

    let cancelled = false;

    const connect = async () => {
      try {
        setError(null);
        setIsReady(false);

        const token = await getChatToken();
        if (cancelled) return;

        const client = StreamChat.getInstance(API_KEY);
        clientRef.current = client;

        await client.connectUser(
          {
            id: user.id,
            name: user.username || user.firstName || 'User',
            image: user.imageUrl,
          },
          token
        );

        if (cancelled) return;

        // Server must create the channel and add this user before client watch().
        await joinMeetingChat(streamCallId);
        if (cancelled) return;

        const [history] = await Promise.all([getChatHistory(streamCallId)]);
        if (cancelled) return;
        setMessages(sortMessages(history));

        const channel = client.channel(
          MEETING_CHANNEL_TYPE,
          getMeetingChannelId(streamCallId)
        );

        await channel.watch({ presence: false });
        channelRef.current = channel;

        channel.on('message.new', handleIncoming);
        setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not connect to meeting chat'
          );
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      channelRef.current?.off('message.new', handleIncoming);
      channelRef.current?.stopWatching().catch(() => undefined);
      channelRef.current = null;
      clientRef.current?.disconnectUser().catch(() => undefined);
      clientRef.current = null;
      setIsReady(false);
    };
  }, [isOpen, user, streamCallId, handleIncoming]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user || !channelRef.current || isSending) return;

    setIsSending(true);
    setInput('');

    try {
      await channelRef.current.sendMessage({ text });
    } catch {
      setInput(text);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  if (!API_KEY) {
    return (
      <aside className="flex h-[calc(100vh-86px)] w-[320px] flex-col rounded-xl bg-dark-1 p-4 text-white">
        <p className="text-sm text-sky-1">Chat requires Stream API keys.</p>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'flex h-[calc(100vh-86px)] w-[320px] flex-col overflow-hidden rounded-xl border border-dark-3 bg-dark-1 shadow-lg'
      )}
    >
      <header className="flex items-center justify-between border-b border-dark-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-blue-1" />
          <h2 className="font-semibold">Meeting chat</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-dark-3"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </header>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3"
      >
        {!isReady && !error && (
          <div className="flex flex-1 items-center justify-center">
            <Loader />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/20 p-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {isReady && messages.length === 0 && (
          <p className="text-center text-sm text-sky-2">
            No messages yet. Say hello to everyone in the meeting.
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = msg.userId === user?.id;
          return (
            <div
              key={msg.id}
              className={cn('flex flex-col gap-0.5', {
                'items-end': isOwn,
                'items-start': !isOwn,
              })}
            >
              <span className="text-xs font-medium text-sky-2">
                {isOwn ? 'You' : msg.userName}
              </span>
              <p
                className={cn(
                  'max-w-[240px] rounded-lg px-3 py-2 text-sm break-words',
                  isOwn ? 'bg-blue-1 text-white' : 'bg-dark-3 text-white'
                )}
              >
                {msg.text}
              </p>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-dark-3 p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={!isReady || isSending}
          maxLength={2000}
          className="border-none bg-dark-3 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="submit"
          disabled={!isReady || isSending || !input.trim()}
          className="bg-blue-1 px-3"
          aria-label="Send message"
        >
          <Send size={18} />
        </Button>
      </form>
    </aside>
  );
}
