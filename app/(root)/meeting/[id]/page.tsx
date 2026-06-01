'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useState } from 'react';

import Loader from '@/components/Loader';
import MeetingRoom from '@/components/MeetingRoom';
import MeetingSetup from '@/components/MeetingSetup';
import { Button } from '@/components/ui/button';
import { useGetCallById } from '@/hooks/useGetCallById';

const Meeting = ({ params: { id } }: { params: { id: string } }) => {
  const { isLoaded } = useUser();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { call, isCallLoading } = useGetCallById(id);

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call) {
    return (
      <main className="flex h-screen w-full flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-2xl font-bold">Meeting not found</h1>
        <p className="text-sky-1">
          This meeting may have ended or the link is invalid.
        </p>
        <Button asChild className="bg-blue-1">
          <Link href="/">Return home</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default Meeting;
