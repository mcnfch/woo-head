import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedPaths = [
  '/profile',
  '/account',
  '/orders',
];

// Public paths that should never redirect to login
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password'
];

// System files that should never be routed to pages
const systemFiles = [
  '.env',
  '.env.local',
  '.gitignore',
  'package.json',
  'yarn.lock',
  'tsconfig.json'
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Block access to system files
  const fileName = path.split('/').pop();
  if (fileName && systemFiles.includes(fileName)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Don't redirect if the path is public
  if (publicPaths.some(p => path.startsWith(p))) {
    // If user is already logged in and trying to access login/register pages,
    // redirect them to profile
    const token = request.cookies.get('auth_token');
    if (token) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
    return NextResponse.next();
  }

  // Check for authentication on protected routes
  if (protectedPaths.some(route => path.startsWith(route))) {
    const token = request.cookies.get('auth_token');
    
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', path);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

// Configure which paths should use this middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/profile/:path*',
    '/account/:path*',
    '/orders/:path*',
    '/login',
    '/register',
    '/forgot-password'
  ]
};