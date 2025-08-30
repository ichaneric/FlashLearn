// File: [id]/route.ts
// Description: API endpoint for updating set details (PATCH)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import jwt from 'jsonwebtoken';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

/**
 * Updates set details (title, subject, description)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[PATCH /api/sets/[id]] Updating set:', id);

    // Extract and verify token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Authorization header missing' }, { status: 401 }),
        req.headers.get('origin')
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Bearer token missing' }, { status: 401 }),
        req.headers.get('origin')
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any;
    } catch (error) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
        req.headers.get('origin')
      );
    }

    const userId = decoded.user_id;
    const setId = id;

    // Parse request body
    const body = await req.json();
    const { set_name, set_subject, description } = body;

    // Validate required fields
    if (!set_name?.trim()) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Set name is required' }, { status: 400 }),
        req.headers.get('origin')
      );
    }

    // Check if set exists and user owns it
    const existingSet = await prisma.set.findUnique({
      where: { set_id: setId },
      select: { user_id: true }
    });

    if (!existingSet) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Set not found' }, { status: 404 }),
        req.headers.get('origin')
      );
    }

    if (existingSet.user_id !== userId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized to edit this set' }, { status: 403 }),
        req.headers.get('origin')
      );
    }

    // Update the set
    const updatedSet = await prisma.set.update({
      where: { set_id: setId },
      data: {
        set_name: set_name.trim(),
        set_subject: set_subject?.trim() || null,
        description: description?.trim() || null
      },
      include: {
        cards: true,
        user: {
          select: {
            full_name: true,
            username: true
          }
        }
      }
    });

    console.log('[PATCH /api/sets/[id]] Set updated successfully');

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        set: updatedSet,
        message: 'Set updated successfully'
      }),
      req.headers.get('origin')
    );

  } catch (error) {
    console.error('[PATCH /api/sets/[id]] Error:', error);
    return addCorsHeaders(
      NextResponse.json({ 
        error: 'Failed to update set',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }),
      req.headers.get('origin')
    );
  }
}
