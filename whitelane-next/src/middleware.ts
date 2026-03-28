import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/v1') || request.nextUrl.pathname === '/up') {
    const res = NextResponse.next();
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/v1/:path*', '/up'],
};
