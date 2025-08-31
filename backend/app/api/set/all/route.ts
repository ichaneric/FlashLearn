// File: route.ts
// Description: Handles fetching all flashcard sets for authenticated user with secure JWT validation

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

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
    console.log('[GET /api/set/all] Token decoded successfully');
    console.log('[GET /api/set/all] User ID from token:', userId);
    console.log('[GET /api/set/all] Full decoded token:', JSON.stringify(decoded, null, 2));
    
    if (!userId) {
      console.error('[GET /api/set/all] Error: No user_id found in token');
      const response = NextResponse.json({ 
        success: false,
        error: 'Invalid token - no user_id found' 
      }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    // First, verify the user exists
    const userExists = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, username: true, full_name: true }
    });
    
    if (!userExists) {
      console.error(`[GET /api/set/all] Error: User with ID ${userId} not found in database`);
      const response = NextResponse.json({ 
        success: false,
        error: 'User not found in database' 
      }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    console.log(`[GET /api/set/all] User verified: ${userExists.username} (${userExists.full_name})`);
    
    // Check for any orphaned sets or sets with incorrect user_id
    const allSetsInDatabase = await prisma.set.findMany({
      select: {
        set_id: true,
        set_name: true,
        user_id: true,
        user: {
          select: {
            username: true,
            full_name: true
          }
        }
      }
    });
    
    console.log(`[GET /api/set/all] Total sets in database: ${allSetsInDatabase.length}`);
    console.log('[GET /api/set/all] All sets in database:', allSetsInDatabase.map(s => ({
      set_id: s.set_id,
      set_name: s.set_name,
      user_id: s.user_id,
      creator_username: s.user?.username,
      creator_name: s.user?.full_name
    })));
    
    // Check for orphaned sets (sets without valid user)
    const orphanedSets = allSetsInDatabase.filter(set => !set.user);
    if (orphanedSets.length > 0) {
      console.error('[GET /api/set/all] WARNING: Found orphaned sets without valid user!');
      console.error('[GET /api/set/all] Orphaned sets:', orphanedSets);
    }
    
    // Get all sets for this user with detailed information
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
      orderBy: {
        date_created: 'desc'
      }
    });
    
    console.log(`[GET /api/set/all] Found ${sets.length} sets for user_id: ${userId}`);
    console.log('[GET /api/set/all] Set details:', sets.map(s => ({
      set_id: s.set_id,
      set_name: s.set_name,
      user_id: s.user_id,
      creator_username: s.user?.username,
      creator_name: s.user?.full_name,
      posted: s.posted,
      status: s.status,
      cards_count: s.cards.length,
      date_created: s.date_created
    })));
    
    // Double-check: Verify all sets belong to the correct user
    const incorrectSets = sets.filter(set => set.user_id !== userId);
    if (incorrectSets.length > 0) {
      console.error('[GET /api/set/all] CRITICAL ERROR: Found sets that do not belong to the user!');
      console.error('[GET /api/set/all] Incorrect sets:', incorrectSets.map(s => ({
        set_id: s.set_id,
        set_name: s.set_name,
        actual_user_id: s.user_id,
        expected_user_id: userId
      })));
    }
    
    // Return success response with data - always return array
    const response = NextResponse.json({
      success: true,
      sets: sets || [],
      message: sets.length === 0 ? 'No sets found' : `Found ${sets.length} sets`,
      debug: {
        user_id: userId,
        username: userExists.username,
        sets_count: sets.length,
        incorrect_sets_count: incorrectSets.length
      }
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
  }
}