import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, createCorsPreflightResponse } from './app/lib/corsUtils';

// Global error logging function
function logGlobalError(error: any, request: NextRequest) {
  console.error('[GLOBAL ERROR]:', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    error: {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    },
  });
}

// Middleware function to handle all requests
export function middleware(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);
  const origin = request.headers.get('origin');
  
  // Log all API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`[MIDDLEWARE ${requestId}] ${request.method} ${request.nextUrl.pathname}`, {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      origin: origin,
      contentType: request.headers.get('content-type'),
    });
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return createCorsPreflightResponse(origin);
  }

  // Add secure CORS headers to all API responses
  const response = NextResponse.next();
  return addCorsHeaders(response, origin);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 