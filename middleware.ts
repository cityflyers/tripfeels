import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has('auth_token'); // Replace with your actual auth cookie name
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isBookingPage = request.nextUrl.pathname.startsWith('/booking');

  // If user is not authenticated and trying to access booking page
  if (!isAuthenticated && isBookingPage) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/booking/:path*', '/auth/:path*']
}; 