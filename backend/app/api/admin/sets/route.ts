// File: backend/app/api/admin/sets/route.ts
// Description: Admin sets API endpoint providing set management data

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
      console.error('[GET admin/sets] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      console.error('[GET admin/sets] Error: Access denied - User is not admin');
      const response = NextResponse.json({ error: 'Access denied' }, { status: 403 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Get all sets with their statistics
    const sets = await prisma.set.findMany({
      select: {
        set_id: true,
        set_name: true,
        set_subject: true,
        description: true,
        date_created: true,
        posted: true,
        status: true,
        user: {
          select: {
            username: true,
            full_name: true
          }
        },
        _count: {
          select: {
            cards: true,
            savedBy: true
          }
        }
      },
      orderBy: {
        date_created: 'desc'
      }
    });

    // Process set data to include statistics
    const processedSets = sets.map(set => ({
      set_id: set.set_id,
      set_name: set.set_name,
      set_subject: set.set_subject,
      description: set.description,
      date_created: set.date_created,
      posted: set.posted,
      status: set.status,
      cards_count: set._count.cards,
      learners_count: set._count.savedBy,
      creator: {
        username: set.user.username,
        full_name: set.user.full_name
      }
    }));

    console.log('[GET admin/sets] Sets data retrieved successfully');

    const response = NextResponse.json(processedSets);
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET admin/sets] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
}

export async function POST(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[POST admin/sets] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[POST admin/sets] Error:', error);
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
      console.error('[PUT admin/sets] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[PUT admin/sets] Error:', error);
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
      console.error('[DELETE admin/sets] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[DELETE admin/sets] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}