// File: route.ts
// Description: API endpoint to fetch the current user's saved sets (backpack) with proper user scoping

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

// Create a single Prisma client instance
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to prevent multiple instances
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

/**
 * Fetches all sets saved by the current user (user's backpack)
 * @param {NextRequest} req - The incoming request
 * @returns {NextResponse} - Response with user's saved sets
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[GET set/backpack] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Fetch all sets saved by the current user with full set details
    const savedSets = await prisma.setSave.findMany({
      where: {
        user_id: decoded.user_id
      },
      include: {
        set: {
          include: {
            user: {
              select: {
                username: true,
                full_name: true,
                profile: true
              }
            },
            cards: {
              select: {
                card_id: true,
                card_question: true,
                card_answer: true,
                color: true
              }
            },
            savedBy: {
              select: {
                user_id: true
              }
            }
          }
        }
      },
      orderBy: {
        saved_at: 'desc'
      }
    });

    // Transform the data to match frontend expectations
    const backpackSets = savedSets.map(save => ({
      set_id: save.set.set_id,
      set_name: save.set.set_name,
      set_subject: save.set.set_subject,
      description: save.set.description,
      date_created: save.set.date_created,
      number_of_cards: save.set.number_of_cards,
      category: save.set.category,
      posted: save.set.posted,
      status: save.set.status,
      creator: {
        username: save.set.user.username,
        full_name: save.set.user.full_name,
        profile: save.set.user.profile
      },
      cards: save.set.cards,
      learnerCount: save.set.savedBy.length,
      saved_at: save.saved_at
    }));

    const response = NextResponse.json({ 
      success: true,
      backpackSets,
      count: backpackSets.length
    });
    return addCorsHeaders(response, req.headers.get('origin'));

  } catch (error) {
    console.error('[GET set/backpack] Error:', error);
    console.error('[GET set/backpack] Error details:', {
      message: error.message,
      stack: error.stack,
      user_id: decoded?.user_id
    });
    const response = NextResponse.json({ 
      success: false,
      error: 'Failed to fetch backpack sets',
      backpackSets: [],
      count: 0
    }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}
