'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpView() {
  return (
    <main className="flex h-screen w-full items-center justify-center">
      <SignUp />
    </main>
  );
}
