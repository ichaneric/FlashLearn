// File: route.ts
// Description: Handles set/[set_id] operations with secure JWT validation

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

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
      console.error('[GET set/[set_id]] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Extract set_id from URL
    const set_id = req.nextUrl.pathname.split('/').pop();
    if (!set_id) {
      const response = NextResponse.json({ 
        success: false,
        error: 'Set ID is required' 
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Fetch set with cards
    const set = await prisma.set.findUnique({
      where: { set_id },
      include: {
        cards: true,
        user: { 
          select: { 
            user_id: true,
            full_name: true,
            profile: true,
            username: true
          } 
        },
      },
    });

    if (!set) {
      const response = NextResponse.json({ 
        success: false,
        error: 'Set not found' 
      }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const response = NextResponse.json({
      success: true,
      set: set,
      cards: set.cards || [],
      message: set.cards.length === 0 ? 'This set has no cards yet' : `Found ${set.cards.length} cards`
    });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error: any) {
    console.error('[GET set/[set_id]] Error:', error);
    
    let errorMessage = 'Failed to fetch set';
    let statusCode = 500;
    
    // Handle specific error types
    if (error?.code === 'P2025') {
      errorMessage = 'Set not found';
      statusCode = 404;
    } else if (error?.message?.includes('connect')) {
      errorMessage = 'Database connection failed';
      statusCode = 503;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    const response = NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: statusCode });
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
      console.error('[POST set/[set_id]] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[POST set/[set_id]] Error:', error);
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
      console.error('[PUT set/[set_id]] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[PUT set/[set_id]] Error:', error);
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
      console.error('[DELETE set/[set_id]] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[DELETE set/[set_id]] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}