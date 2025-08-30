// File: route.ts
// Description: Handles set/send operations with secure JWT validation

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractAndVerifyToken  } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse  } from '@/lib/corsUtils';

const prisma = new PrismaClient();

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function GET(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[GET set/send] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET set/send] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[POST set/send] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[POST set/send] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[PUT set/send] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[PUT set/send] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[DELETE set/send] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[DELETE set/send] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}