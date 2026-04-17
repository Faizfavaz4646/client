import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge middleware to protect private routes
export function proxy(request: NextRequest) {
  // Grab the auth token from cookies 
  const token = request.cookies.get('accessToken')?.value;

  // If the user isn't logged in, redirect them to the home/login screen
  if (!token) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, proceed to the requested route
  return NextResponse.next();
}

// Specify exactly which routes require authentication
export const config = {
  matcher: [

    '/workspace/:path*',
 
  ],
};