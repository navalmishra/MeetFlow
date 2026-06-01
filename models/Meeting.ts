import { Schema, model, models } from 'mongoose';

import type { MeetingStatus, MeetingType } from '@/types/meeting';

export interface IMeeting {
  streamCallId: string;
  hostId: string;
  hostName: string;
  title: string;
  type: MeetingType;
  startsAt: Date;
  endedAt?: Date;
  status: MeetingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    streamCallId: { type: String, required: true, index: true },
    hostId: { type: String, required: true, index: true },
    hostName: { type: String, required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['instant', 'scheduled', 'personal'],
      required: true,
    },
    startsAt: { type: Date, required: true },
    endedAt: { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

MeetingSchema.index({ hostId: 1, status: 1, startsAt: -1 });
MeetingSchema.index({ hostId: 1, streamCallId: 1, status: 1 });

export const Meeting =
  models.Meeting || model<IMeeting>('Meeting', MeetingSchema);

export default Meeting;
