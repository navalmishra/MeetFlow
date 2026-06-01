/** Stream channel type for in-meeting chat. */
export const MEETING_CHANNEL_TYPE = 'meeting';

/** Stream user attributed as channel creator for server-side create(). */
export const STREAM_CHAT_CHANNEL_CREATOR_ID = 'meetflow-system';

export function getMeetingChannelId(streamCallId: string) {
  return `meeting-${streamCallId}`;
}
