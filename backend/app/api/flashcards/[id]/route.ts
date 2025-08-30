// File: [id]/route.ts
// Description: API endpoint for editing and deleting individual flashcards

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import jwt from 'jsonwebtoken';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

/**
 * Updates a flashcard
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[PATCH /api/flashcards/[id]] Updating flashcard:', id);

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
    const cardId = id;

    // Parse request body
    const body = await req.json();
    const { card_question, card_answer } = body;

    // Validate required fields
    if (!card_question?.trim() && !card_answer?.trim()) {
      return addCorsHeaders(
        NextResponse.json({ error: 'At least one field must be provided' }, { status: 400 }),
        req.headers.get('origin')
      );
    }

    // Check if flashcard exists and user owns the set
    const existingCard = await prisma.card.findUnique({
      where: { card_id: cardId },
      include: {
        set: {
          select: { user_id: true }
        }
      }
    });

    if (!existingCard) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Flashcard not found' }, { status: 404 }),
        req.headers.get('origin')
      );
    }

    if (existingCard.set.user_id !== userId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized to edit this flashcard' }, { status: 403 }),
        req.headers.get('origin')
      );
    }

    // Update the flashcard
    const updateData: any = {};
    if (card_question?.trim()) updateData.card_question = card_question.trim();
    if (card_answer?.trim()) updateData.card_answer = card_answer.trim();

    const updatedCard = await prisma.card.update({
      where: { card_id: cardId },
      data: updateData
    });

    console.log('[PATCH /api/flashcards/[id]] Flashcard updated successfully');

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        card: updatedCard,
        message: 'Flashcard updated successfully'
      }),
      req.headers.get('origin')
    );

  } catch (error) {
    console.error('[PATCH /api/flashcards/[id]] Error:', error);
    return addCorsHeaders(
      NextResponse.json({ 
        error: 'Failed to update flashcard',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }),
      req.headers.get('origin')
    );
  }
}

/**
 * Deletes a flashcard
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[DELETE /api/flashcards/[id]] Deleting flashcard:', id);

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
    const cardId = id;

    // Check if flashcard exists and user owns the set
    const existingCard = await prisma.card.findUnique({
      where: { card_id: cardId },
      include: {
        set: {
          select: { user_id: true }
        }
      }
    });

    if (!existingCard) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Flashcard not found' }, { status: 404 }),
        req.headers.get('origin')
      );
    }

    if (existingCard.set.user_id !== userId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Unauthorized to delete this flashcard' }, { status: 403 }),
        req.headers.get('origin')
      );
    }

    // Delete the flashcard
    await prisma.card.delete({
      where: { card_id: cardId }
    });

    console.log('[DELETE /api/flashcards/[id]] Flashcard deleted successfully');

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'Flashcard deleted successfully'
      }),
      req.headers.get('origin')
    );

  } catch (error) {
    console.error('[DELETE /api/flashcards/[id]] Error:', error);
    return addCorsHeaders(
      NextResponse.json({ 
        error: 'Failed to delete flashcard',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }),
      req.headers.get('origin')
    );
  }
}
