import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import compression from 'compression';
import type { Request, Response } from 'express';

const compressionMiddleware = compression();

// Type definitions for the compression middleware
type CompressionMiddleware = (
  req: Request,
  res: Response,
  next: () => void
) => void;

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Promise((resolve) => {
      (compressionMiddleware as CompressionMiddleware)(
        request as unknown as Request,
        NextResponse.next() as unknown as Response,
        () => {
          resolve(NextResponse.next());
        }
      );
    });
  }
  return NextResponse.next();
}

// Configure which paths should use this middleware
export const config = {
  matcher: [
    // Apply compression to all routes except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}; 