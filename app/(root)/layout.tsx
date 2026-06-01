
import React, { ReactNode } from 'react';
import StreamVideoProvider from '@/providers/StreamClientProvider';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "MeetFlow",
  description: "MeetFlow — video calling made easy",
  icons : {
    icon : "/icons/logo.svg"
  }
};


const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <main>
        <StreamVideoProvider>{children}</StreamVideoProvider>
    </main>
  );
};

export default RootLayout;