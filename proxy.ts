import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('bnb_auth');
  
  if (authCookie?.value === 'true') {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/guests/:path*',
    // Exclude /api/auth routes from proxy
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
