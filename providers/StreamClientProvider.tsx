'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim();
const CLERK_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
);

function StreamVideoProviderInner({ children }: { children: ReactNode }) {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!API_KEY || !isLoaded || !user) return;

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user.id,
        name: user.username || user.id,
        image: user.imageUrl,
      },
      tokenProvider,
    });

    setVideoClient(client);

    return () => {
      void client.disconnectUser();
    };
  }, [user, isLoaded]);

  if (!API_KEY) {
    return (
      <div className="flex flex-col">
        <p className="bg-orange-1/20 px-4 py-3 text-center text-sm text-white">
          Video is disabled: set NEXT_PUBLIC_STREAM_API_KEY in .env.local
        </p>
        {children}
      </div>
    );
  }

  if (!isLoaded || !user) return <Loader />;

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
}

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  if (!CLERK_CONFIGURED) {
    return <>{children}</>;
  }

  return <StreamVideoProviderInner>{children}</StreamVideoProviderInner>;
};

export default StreamVideoProvider;
