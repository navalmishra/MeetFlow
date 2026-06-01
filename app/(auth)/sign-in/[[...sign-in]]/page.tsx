import { redirect } from 'next/navigation';

import { isClerkConfigured } from '@/lib/env';
import SignInView from './SignInView';

export default function SignInPage() {
  if (!isClerkConfigured()) {
    redirect('/setup');
  }

  return <SignInView />;
}
