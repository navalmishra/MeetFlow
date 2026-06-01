'use client'

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk'
import React from 'react'
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { markMeetingCompleted } from '@/actions/meeting.actions';

function EndCallButton() {
  const call = useCall(); 
  const router = useRouter();
  
  const { useLocalParticipant } = useCallStateHooks();
  const LocalParticipant = useLocalParticipant();

  const inMeetingOwer = LocalParticipant && call?.state.createdBy && 
  LocalParticipant.userId === call?.state.createdBy.id;

  if(!inMeetingOwer) return null;
  return (
    <Button onClick = {async () => {
        if (call?.id) {
          await markMeetingCompleted(call.id);
        }
        await call?.endCall();
        router.push('/');
    }} className='bg-red-500'>
        End Call for everyone
    </Button>
  )
}

export default EndCallButton