// File: route.ts
// Description: Handles set/[set_id]/publish operations with secure JWT validation

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken  } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse  } from '@/lib/corsUtils';

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
      console.error('[GET set/[set_id]/publish] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET set/[set_id]/publish] Error:', error);
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
      console.error('[POST set/[set_id]/publish] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[POST set/[set_id]/publish] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest, { params }: { params: { set_id: string } }) {
  const { set_id } = params;
  
  try {
    console.log(`[PUT set/[set_id]/publish] Publishing set:`, set_id);
    
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[PUT set/[set_id]/publish] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const userId = (decoded as any).user_id;
    console.log(`[PUT set/[set_id]/publish] User ID:`, userId);

    // Check if set exists and user owns it
    const existingSet = await prisma.set.findUnique({
      where: { set_id },
      include: { cards: true }
    });

    if (!existingSet) {
      console.error(`[PUT set/[set_id]/publish] Set not found:`, set_id);
      const response = NextResponse.json({ error: 'Set not found' }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    if (existingSet.user_id !== userId) {
      console.error(`[PUT set/[set_id]/publish] Unauthorized access - user ${userId} trying to publish set ${set_id} owned by ${existingSet.user_id}`);
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Only allow publishing draft sets
    if (existingSet.status === 'published') {
      console.log(`[PUT set/[set_id]/publish] Set ${set_id} is already published`);
      const response = NextResponse.json({ error: 'Set is already published' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Validate that the set has content
    if (!existingSet.set_name || !existingSet.set_subject) {
      console.error(`[PUT set/[set_id]/publish] Set ${set_id} missing required fields`);
      const response = NextResponse.json({ error: 'Set must have a title and subject' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    if (!existingSet.cards || existingSet.cards.length === 0) {
      console.error(`[PUT set/[set_id]/publish] Set ${set_id} has no cards`);
      const response = NextResponse.json({ error: 'Set must have at least one card' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Publish the set
    const publishedSet = await prisma.set.update({
      where: { set_id },
      data: { 
        status: 'published',
        posted: true // Also set posted to true for backward compatibility
      },
      include: { cards: true }
    });

    console.log(`[PUT set/[set_id]/publish] Set ${set_id} published successfully`);
    const response = NextResponse.json({ 
      message: 'Set published successfully',
      set: publishedSet
    });
    return addCorsHeaders(response, req.headers.get('origin'));

  } catch (error) {
    console.error('[PUT set/[set_id]/publish] Error:', error);
    const response = NextResponse.json({ error: 'Failed to publish set' }, { status: 500 });
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
      console.error('[DELETE set/[set_id]/publish] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[DELETE set/[set_id]/publish] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}