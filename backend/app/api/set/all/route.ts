// File: route.ts
// Description: Handles fetching all flashcard sets for authenticated user with secure JWT validation

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
      console.error('[GET /api/set/all] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const userId = (decoded as any).user_id;
    console.log('[GET /api/set/all] Fetching sets for user_id:', userId);
    
    const sets = await prisma.set.findMany({
      where: { user_id: userId },
      include: {
        cards: true,
        user: { 
          select: { 
            full_name: true,
            profile: true,
            username: true
          } 
        },
      },
    });
    
    // Return success response with data - always return array
    const response = NextResponse.json({
      success: true,
      sets: sets || [],
      message: sets.length === 0 ? 'No sets found' : `Found ${sets.length} sets`
    });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error: any) {
    console.error('[GET /api/set/all] Error:', error);
    
    let errorMessage = 'Failed to fetch sets';
    let statusCode = 500;
    
    // Handle specific error types
    if (error?.code === 'P2025') {
      errorMessage = 'No sets found';
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