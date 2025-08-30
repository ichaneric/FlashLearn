// File: route.ts
// Description: Handles flashcard creation with secure JWT validation and proper error handling

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function POST(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[POST /api/card/create] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const { card_question, card_answer, set_id, color } = await req.json();
    
    // Validate required fields
    if (!card_question || !card_answer || !set_id || !color) {
      const response = NextResponse.json({ 
        success: false,
        error: 'Missing required fields' 
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Validate set ownership
    const set = await prisma.set.findUnique({ where: { set_id } });
    if (!set) {
      const response = NextResponse.json({ 
        success: false,
        error: 'Set not found' 
      }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    if (set.user_id !== (decoded as any).user_id) {
      const response = NextResponse.json({ 
        success: false,
        error: 'Unauthorized to modify this set' 
      }, { status: 403 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    // Check card limit
    if (set.number_of_cards >= 30) {
      const response = NextResponse.json({ 
        success: false,
        error: 'Set has reached maximum 30 cards' 
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Create the card
    const card = await prisma.card.create({
      data: {
        card_id: uuidv4(),
        card_question,
        card_answer,
        set_id,
        color,
      },
    });

    // Update set card count
    await prisma.set.update({
      where: { set_id },
      data: { number_of_cards: { increment: 1 } },
    });

    const response = NextResponse.json({ 
      success: true,
      message: 'Card created successfully', 
      card 
    });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error: unknown) {
    console.error('[POST /api/card/create] Error:', error);
    
    let errorMessage = 'Card creation failed';
    let statusCode = 500;
    
    // Handle specific error types
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        errorMessage = 'Card already exists';
        statusCode = 409;
      } else if (error.code === 'P2003') {
        errorMessage = 'Invalid set reference';
        statusCode = 400;
      }
    }
    
    if (error instanceof Error) {
      if (error.message?.includes('connect')) {
        errorMessage = 'Database connection failed';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
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