// File: route.ts
// Description: Simple health check endpoint to verify server is working

import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, createCorsPreflightResponse } from '../../lib/corsUtils';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function GET(req: NextRequest) {
  try {
    const response = NextResponse.json({
      status: 'healthy',
      message: 'FlashLearn API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
    
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[Health Check] Error:', error);
    const response = NextResponse.json({
      status: 'error',
      message: 'Server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
    return addCorsHeaders(response, req.headers.get('origin'));
  }
}
