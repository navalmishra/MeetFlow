import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextMiddleware, NextRequest } from 'next/server';

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
);

const protectedRoutes = createRouteMatcher([
  '/',
  '/upcoming',
  '/previous',
  '/meeting-history',
  '/recordings',
  '/personal-room',
  '/meeting(.*)',
]);

let clerkAuth: NextMiddleware | null = null;

function getClerkAuth() {
  if (!clerkAuth) {
    clerkAuth = clerkMiddleware((auth, req) => {
      if (protectedRoutes(req)) auth().protect();
    });
  }
  return clerkAuth;
}

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured) {
    if (req.nextUrl.pathname === '/setup') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/setup', req.url));
  }

  return getClerkAuth()(req, event);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
