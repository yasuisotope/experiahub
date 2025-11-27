import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Redirect only the root path of the app subdomain to the main WordPress site.
export function middleware(request: NextRequest) {
  // Match exactly the root path ("/")
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('https://experiahub.com'));
  }
  return NextResponse.next();
}

// Apply this middleware only to the root path of the app domain
export const config = {
  matcher: ['/'],
};

