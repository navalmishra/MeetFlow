'use client';

import {
  CallingState,
  DeviceSettings,
  useCall,
  useCallStateHooks,
  VideoPreview,
} from '@stream-io/video-react-sdk';
import { useEffect, useState } from 'react';

import { joinMeetingChat } from '@/actions/chat.actions';
import { markMeetingActive } from '@/actions/meeting.actions';
import Loader from './Loader';
import { Button } from './ui/button';

function MeetingSetup({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) {
  const [isMicCamToggledOn, setIsMicCamToggledOn] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (!call) return;

    if (isMicCamToggledOn) {
      call.camera.enable();
      call.microphone.enable();
    } else {
      call.camera.disable();
      call.microphone.disable();
    }
  }, [isMicCamToggledOn, call]);

  if (!call) return <Loader />;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-2xl font-bold">Setup</h1>
      <VideoPreview />
      <div className="flex h-16 items-center justify-center gap-3">
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isMicCamToggledOn}
            onChange={(e) => setIsMicCamToggledOn(e.target.checked)}
          />
          Join with mic and camera on
        </label>
        <DeviceSettings />
      </div>
      <Button
        className="rounded-md bg-green-500 px-4 py-2.5"
        disabled={isJoining}
        onClick={async () => {
          if (isJoining) return;
          setIsJoining(true);

          try {
            try {
              await markMeetingActive(call.id);
            } catch {
              // History save is optional.
            }

            try {
              await joinMeetingChat(call.id);
            } catch {
              // Chat is optional — do not block joining the video call.
            }

            const alreadyJoined =
              callingState === CallingState.JOINED ||
              call.state.callingState === CallingState.JOINED;

            if (!alreadyJoined) {
              try {
                await call.join();
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : String(error);
                if (!message.includes('Already joined')) throw error;
              }
            }

            setIsSetupComplete(true);
          } finally {
            setIsJoining(false);
          }
        }}
      >
        {isJoining ? 'Joining…' : 'Join Meeting'}
      </Button>
    </div>
  );
}

export default MeetingSetup;
