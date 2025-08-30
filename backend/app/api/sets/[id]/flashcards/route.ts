// File: flashcards/route.ts
// Description: API endpoint for adding new flashcards to a set

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import jwt from 'jsonwebtoken';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';
import { v4 as uuidv4 } from 'uuid';

export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

/**
 * Adds a new flashcard to a set
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[POST /api/sets/[id]/flashcards] Adding flashcard to set:', id);

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
    const { card_question, card_answer } = body;

    // Validate required fields
    if (!card_question?.trim()) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Card question is required' }, { status: 400 }),
        req.headers.get('origin')
      );
    }

    if (!card_answer?.trim()) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Card answer is required' }, { status: 400 }),
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

    // Create the new flashcard
    const newCard = await prisma.card.create({
      data: {
        card_id: uuidv4(),
        set_id: setId,
        card_question: card_question.trim(),
        card_answer: card_answer.trim(),
        color: 'blue' // Default color
      }
    });

    console.log('[POST /api/sets/[id]/flashcards] Flashcard added successfully');

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        card: newCard,
        message: 'Flashcard added successfully'
      }),
      req.headers.get('origin')
    );

  } catch (error) {
    console.error('[POST /api/sets/[id]/flashcards] Error:', error);
    return addCorsHeaders(
      NextResponse.json({ 
        error: 'Failed to add flashcard',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }),
      req.headers.get('origin')
    );
  }
}
