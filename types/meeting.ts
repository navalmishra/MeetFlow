export type MeetingType = 'instant' | 'scheduled' | 'personal';

export type MeetingStatus = 'scheduled' | 'active' | 'completed';

export type MeetingRecord = {
  id: string;
  streamCallId: string;
  hostId: string;
  hostName: string;
  title: string;
  type: MeetingType;
  startsAt: string;
  endedAt?: string;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
};

export type SaveMeetingInput = {
  streamCallId: string;
  title: string;
  type: MeetingType;
  startsAt: string;
  status?: MeetingStatus;
};
