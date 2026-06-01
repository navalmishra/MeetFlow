'use server';

import { currentUser } from '@clerk/nextjs/server';

import { connectToDatabase, tryConnectToDatabase } from '@/lib/mongodb';
import Meeting from '@/models/Meeting';
import type {
  MeetingRecord,
  MeetingStatus,
  SaveMeetingInput,
} from '@/types/meeting';

function serializeMeeting(doc: {
  _id: { toString: () => string };
  streamCallId: string;
  hostId: string;
  hostName: string;
  title: string;
  type: string;
  startsAt: Date;
  endedAt?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): MeetingRecord {
  return {
    id: doc._id.toString(),
    streamCallId: doc.streamCallId,
    hostId: doc.hostId,
    hostName: doc.hostName,
    title: doc.title,
    type: doc.type as MeetingRecord['type'],
    startsAt: doc.startsAt.toISOString(),
    endedAt: doc.endedAt?.toISOString(),
    status: doc.status as MeetingRecord['status'],
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function requireUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/** Persists meeting metadata. Returns null if MongoDB is down (does not throw). */
export async function saveMeetingRecord(
  input: SaveMeetingInput
): Promise<MeetingRecord | null> {
  const user = await requireUser();

  const connected = await tryConnectToDatabase();
  if (!connected) {
    console.warn('Meeting not saved to history: MongoDB unavailable');
    return null;
  }

  try {
    const startsAt = new Date(input.startsAt);
    const status: MeetingStatus = input.status ?? 'scheduled';

    const meeting = await Meeting.create({
      streamCallId: input.streamCallId,
      hostId: user.id,
      hostName: user.username || user.firstName || 'Host',
      title: input.title,
      type: input.type,
      startsAt,
      status,
    });

    return serializeMeeting(meeting);
  } catch (error) {
    console.error('saveMeetingRecord failed:', error);
    return null;
  }
}

export async function markMeetingActive(streamCallId: string) {
  const user = await requireUser();
  if (!(await tryConnectToDatabase())) return null;

  try {
    const meeting = await Meeting.findOneAndUpdate(
      {
        hostId: user.id,
        streamCallId,
        status: { $in: ['scheduled', 'active'] },
      },
      { status: 'active' },
      { sort: { createdAt: -1 }, new: true }
    );

    return meeting ? serializeMeeting(meeting) : null;
  } catch (error) {
    console.error('markMeetingActive failed:', error);
    return null;
  }
}

export async function markMeetingCompleted(streamCallId: string) {
  const user = await requireUser();
  if (!(await tryConnectToDatabase())) return null;

  try {
    const meeting = await Meeting.findOneAndUpdate(
      {
        hostId: user.id,
        streamCallId,
        status: { $in: ['scheduled', 'active'] },
      },
      {
        status: 'completed',
        endedAt: new Date(),
      },
      { sort: { createdAt: -1 }, new: true }
    );

    return meeting ? serializeMeeting(meeting) : null;
  } catch (error) {
    console.error('markMeetingCompleted failed:', error);
    return null;
  }
}

export async function getMeetingHistory(): Promise<MeetingRecord[]> {
  const user = await requireUser();
  await connectToDatabase();

  const meetings = await Meeting.find({
    hostId: user.id,
    status: 'completed',
  })
    .sort({ endedAt: -1, startsAt: -1 })
    .limit(100)
    .lean();

  return meetings.map((doc) =>
    serializeMeeting({
      ...doc,
      _id: { toString: () => String(doc._id) },
      type: doc.type,
      status: doc.status,
      startsAt: doc.startsAt,
      endedAt: doc.endedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })
  );
}
