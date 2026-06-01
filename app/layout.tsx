import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'react-datepicker/dist/react-datepicker.css';

import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { isClerkConfigured } from '@/lib/env';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MeetFlow',
  description: 'MeetFlow — video calling made easy',
  icons: {
    icon: '/icons/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClassName = cn(inter.className, 'bg-dark-2');
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!isClerkConfigured()) {
    return (
      <html lang="en">
        <body className={bodyClassName}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <ClerkProvider
        publishableKey={clerkKey!}
        appearance={{
          layout: {
            socialButtonsVariant: 'iconButton',
          },
          variables: {
            colorText: '#fff',
            colorPrimary: '#0E78F9',
            colorBackground: '#1c1f2e',
            colorInputBackground: '#252a41',
            colorInputText: '#fff',
          },
        }}
      >
        <body className={bodyClassName}>
          {children}
          <Toaster />
        </body>
      </ClerkProvider>
    </html>
  );
}
