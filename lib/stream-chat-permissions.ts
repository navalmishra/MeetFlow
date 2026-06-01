import { MEETING_CHANNEL_TYPE } from '@/lib/meeting-channel';
import { getStreamChatServerClient } from '@/lib/stream-chat-server';

export { MEETING_CHANNEL_TYPE };

const MEETING_CHAT_GRANTS: Record<string, string[]> = {
  user: [
    'create-channel',
    'read-channel',
    'update-channel',
    'create-message',
    'update-message-owner',
    'delete-message-owner',
    'create-reaction',
    'remove-own-channel-membership',
  ],
  channel_member: [
    'read-channel',
    'create-message',
    'update-message-owner',
    'delete-message-owner',
    'create-reaction',
    'remove-own-channel-membership',
  ],
};

function isAlreadyExistsError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('already exists');
}

/**
 * Sync meeting channel type permissions with Stream.
 * Never throws — chat is optional and must not block video calls.
 */
export async function ensureMeetingChatPermissions() {
  const client = getStreamChatServerClient();

  const channelTypeConfig = {
    grants: MEETING_CHAT_GRANTS,
    disable_permissions_checks: true,
  };

  try {
    await client.updateChannelType(MEETING_CHANNEL_TYPE, channelTypeConfig);
    return;
  } catch (updateError) {
    if (!isAlreadyExistsError(updateError)) {
      console.warn('updateChannelType(meeting) failed:', updateError);
    }
  }

  try {
    await client.getChannelType(MEETING_CHANNEL_TYPE);
    return;
  } catch {
    // Type does not exist yet — create it below.
  }

  try {
    await client.createChannelType({
      name: MEETING_CHANNEL_TYPE,
      ...channelTypeConfig,
    });
  } catch (createError) {
    if (!isAlreadyExistsError(createError)) {
      console.warn('createChannelType(meeting) failed:', createError);
    }
  }
}
