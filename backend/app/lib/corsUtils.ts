// File: corsUtils.ts
// Description: Secure CORS utilities with proper origin validation

import { NextResponse } from 'next/server';

/**
 * Allowed origins for CORS
 */
const ALLOWED_ORIGINS = [
  // Development origins
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:8090',
  'http://localhost:19006',
  'exp://localhost:19000',
  
  // IP-based development origins
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8090',
  'http://127.0.0.1:19006',
  'exp://127.0.0.1:19000',
  
  // Network development (for physical device testing)
  'http://192.168.254.104:3000',
  'http://192.168.254.104:8081',
  'http://192.168.254.104:8090',
  'http://192.168.254.104:19006',
  'exp://192.168.254.104:19000',
  'http://192.168.137.1:3000',
  'http://192.168.137.1:8081',
  'http://192.168.137.1:8090',
  'http://192.168.137.1:19006',
  'exp://192.168.137.1:19000',
  
  // Add your production domains here
  // 'https://your-production-domain.com',
  // 'https://www.your-production-domain.com',
];

/**
 * Checks if an origin is allowed
 * @param {string} origin - The origin to check
 * @returns {boolean} True if origin is allowed
 */
export const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  
  // Allow localhost and network IPs with any port in development
  if (process.env.NODE_ENV === 'development') {
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('exp://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('exp://127.0.0.1:') ||
        origin.startsWith('http://192.168.254.104:') ||
        origin.startsWith('exp://192.168.254.104:') ||
        origin.startsWith('http://192.168.137.1:') ||
        origin.startsWith('exp://192.168.137.1:')) {
      return true;
    }
  }
  
  return ALLOWED_ORIGINS.includes(origin);
};

/**
 * Adds secure CORS headers to a response
 * @param {NextResponse} response - The response to add headers to
 * @param {string} origin - The request origin
 * @returns {NextResponse} The response with CORS headers
 */
export const addCorsHeaders = (response: NextResponse, origin: string | null): NextResponse => {
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
};

/**
 * Creates a CORS preflight response
 * @param {string} origin - The request origin
 * @returns {NextResponse} The preflight response
 */
export const createCorsPreflightResponse = (origin: string | null): NextResponse => {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
};
