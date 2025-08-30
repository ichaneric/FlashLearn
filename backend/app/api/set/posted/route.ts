import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function GET(req: NextRequest) {
  try {
    console.log('[GET /api/set/posted] Fetching posted sets...');
    
    const sets = await prisma.set.findMany({
      where: { 
        posted: true // Show all sets where posted is true, regardless of status
      },
      include: {
        cards: true,
        user: { 
          select: { 
            full_name: true,
            profile: true,
            username: true
          } 
        },
        savedBy: true, // Include saved sets for learner count
      },
      orderBy: {
        date_created: 'desc' // Show newest sets first
      }
    });

    console.log(`[GET /api/set/posted] Found ${sets.length} posted sets`);

    // Add learner count to each set based on saved sets
    const setsWithLearnerCount = sets.map(set => ({
      ...set,
      learnerCount: set.savedBy ? set.savedBy.length : 0,
      savedBy: undefined // Remove from response to keep it clean
    }));

    const response = NextResponse.json({
      success: true,
      sets: setsWithLearnerCount || [],
      message: setsWithLearnerCount.length === 0 ? 'No posted sets found' : `Found ${setsWithLearnerCount.length} posted sets`
    });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET /api/set/posted] Error:', error);
    const response = NextResponse.json({ 
      success: false,
      error: 'Failed to fetch posted sets',
      sets: []
    }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
}