// File: route.ts
// Description: API endpoint to handle saving and unsaving sets, tracking learner counts with proper user scoping

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

/**
 * Handles saving and unsaving sets with proper user scoping
 * @param {NextRequest} req - The incoming request
 * @returns {NextResponse} - Response with success status and learner count
 */
export async function POST(req: NextRequest) {
  // Declare variables outside try block for error logging
  let set_id: string | undefined;
  let action: string | undefined;
  let decoded: any;

  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[POST set/save] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const requestData = await req.json();
    set_id = requestData.set_id;
    action = requestData.action;
    
    if (!set_id || !action || !['save', 'unsave'].includes(action)) {
      const response = NextResponse.json({ error: 'Missing set_id or invalid action' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Validate set_id format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(set_id)) {
      const response = NextResponse.json({ error: 'Invalid set_id format' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check if set exists
    const set = await prisma.set.findUnique({ where: { set_id } });
    if (!set) {
      const response = NextResponse.json({ error: 'Set not found' }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    if (action === 'save') {
      // Check if already saved by this user
      const existingSave = await prisma.setSave.findFirst({
        where: {
          user_id: decoded.user_id,
          set_id: set_id
        }
      });
      
      if (!existingSave) {
        // Save the set (create SetSave record) - properly scoped to user
        await prisma.setSave.create({
          data: {
            user_id: decoded.user_id,
            set_id: set_id
          }
        });
      }
    } else {
      // Unsave the set (delete SetSave record) - properly scoped to user
      await prisma.setSave.deleteMany({
        where: {
          user_id: decoded.user_id,
          set_id: set_id
        }
      });
    }

    // Get updated learner count for this specific set
    const learnerCount = await prisma.setSave.count({
      where: { set_id: set_id }
    });

    const response = NextResponse.json({ 
      success: true, 
      learnerCount,
      action 
    });
    return addCorsHeaders(response, req.headers.get('origin'));

  } catch (error) {
    console.error('[POST set/save] Error:', error);
    console.error('[POST set/save] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      set_id: set_id,
      action: action,
      user_id: decoded?.user_id
    });
    const response = NextResponse.json({ error: 'Failed to process save/unsave action' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Gets the save status and learner count for a set for the current user
 * @param {NextRequest} req - The incoming request
 * @returns {NextResponse} - Response with learner count and save status
 */
export async function GET(req: NextRequest) {
  // Declare variables outside try block for error logging
  let set_id: string | undefined;
  let decoded: any;

  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[GET set/save] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const { searchParams } = new URL(req.url);
    set_id = searchParams.get('set_id') || undefined;

    if (!set_id) {
      const response = NextResponse.json({ error: 'Missing set_id parameter' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Validate set_id format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(set_id)) {
      const response = NextResponse.json({ error: 'Invalid set_id format' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // First check if the set exists
    const setExists = await prisma.set.findUnique({
      where: { set_id: set_id },
      select: { set_id: true }
    });

    if (!setExists) {
      console.error(`[GET set/save] Set not found: ${set_id}`);
      const response = NextResponse.json({ 
        learnerCount: 0,
        isSaved: false,
        error: 'Set not found'
      }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Get learner count for the set (all users)
    const learnerCount = await prisma.setSave.count({
      where: { set_id: set_id }
    });

    // Check if current user has saved this set (user-scoped)
    const userSaved = await prisma.setSave.findFirst({
      where: {
        user_id: decoded.user_id,
        set_id: set_id
      }
    });

    const response = NextResponse.json({ 
      learnerCount: learnerCount || 0,
      isSaved: !!userSaved
    });
    return addCorsHeaders(response, req.headers.get('origin'));

  } catch (error) {
    console.error('[GET set/save] Error:', error);
    console.error('[GET set/save] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      set_id: set_id,
      user_id: decoded?.user_id
    });
    
    // Return a more graceful error response instead of 500
    const response = NextResponse.json({ 
      learnerCount: 0,
      isSaved: false,
      error: 'Database error'
    }, { status: 200 }); // Return 200 instead of 500 to prevent frontend errors
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}