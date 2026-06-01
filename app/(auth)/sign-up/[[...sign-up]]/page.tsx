import { redirect } from 'next/navigation';

import { isClerkConfigured } from '@/lib/env';
import SignUpView from './SignUpView';

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    redirect('/setup');
  }

  return <SignUpView />;
}
