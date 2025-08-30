// File: route.ts
// Description: Handles flashcard set creation with secure JWT validation and comprehensive error handling

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken  } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse  } from '@/lib/corsUtils';
import { v4 as uuidv4 } from 'uuid';

// Enhanced logging function
function logError(step: string, error: any, additionalData?: any) {
  console.error(`[SET_CREATE ERROR] ${step}:`, {
    timestamp: new Date().toISOString(),
    step,
    error: {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    },
    additionalData,
  });
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  console.log('[SET_CREATE] OPTIONS request received');
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function POST(req: NextRequest) {
  const requestId = uuidv4().substring(0, 8);
  console.log(`[SET_CREATE ${requestId}] POST request received`);
  
  try {
    // Log request details
    console.log(`[SET_CREATE ${requestId}] Request headers:`, {
      'authorization': req.headers.get('authorization') ? '[PRESENT]' : '[MISSING]',
      'user-agent': req.headers.get('user-agent'),
      'origin': req.headers.get('origin'),
    });

    // Extract and verify token using secure utility
    console.log(`[SET_CREATE ${requestId}] Extracting authorization token...`);
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      logError('TOKEN_INVALID', new Error('Invalid or expired token'), { requestId });
      const response = NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const userId = (decoded as any).user_id;
    console.log(`[SET_CREATE ${requestId}] Token verified for user_id:`, userId);

    // Parse request body
    console.log(`[SET_CREATE ${requestId}] Parsing request body...`);
    const body = await req.json();
    const { set_name, set_subject, category, description, cards } = body; // Accept cards array
    
    console.log(`[SET_CREATE ${requestId}] Received set data:`, { 
      set_name,
      set_subject,
      category,
      bodyKeys: Object.keys(body)
    });

    // Validate required fields
    console.log(`[SET_CREATE ${requestId}] Validating required fields...`);
    if (!set_name || !set_subject) {
      const missingFields = [];
      if (!set_name) missingFields.push('set_name');
      if (!set_subject) missingFields.push('set_subject');
      
      logError('VALIDATION', new Error('Missing required fields'), {
        requestId,
        missingFields,
        receivedData: { set_name, set_subject }
      });
      
      const response = NextResponse.json({ 
        error: 'Missing required fields',
        missingFields 
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Create set in database
    console.log(`[SET_CREATE ${requestId}] Creating set in database...`);
    const setData = {
      set_id: uuidv4(),
      user_id: userId,
      set_name: set_name.trim(),
      set_subject: set_subject.trim(),
      description: description ? String(description).slice(0, 30) : null,
      category: (category && String(category)) || 'unspecified',
      posted: false,
      status: 'draft', // Always create as draft initially
      number_of_cards: 0,
    };
    
    console.log(`[SET_CREATE ${requestId}] Set data prepared:`, setData);
    
    const set = await prisma.set.create({
      data: setData,
    });

    // If cards are provided, create them and associate with the set
    let createdCards = [];
    if (Array.isArray(cards) && cards.length > 0) {
      // Allowed color enums (updated to match frontend's 10 colors)
      const allowedColors = ['yellow', 'blue', 'green', 'pink', 'white', 'lightblue', 'lightgreen', 'purple', 'red', 'brown'];
      for (const card of cards) {
        // Validate card fields
        if (!card.card_question || !card.card_answer || !card.color) continue;
        // Validate color
        const color = allowedColors.includes(card.color) ? card.color : 'yellow';
        const cardData = {
          card_id: uuidv4(),
          set_id: set.set_id,
          card_question: card.card_question,
          card_answer: card.card_answer,
          color,
        };
        const createdCard = await prisma.card.create({ data: cardData });
        createdCards.push(createdCard);
      }
      // Update set's number_of_cards
      await prisma.set.update({
        where: { set_id: set.set_id },
        data: { number_of_cards: createdCards.length },
      });
    }

    console.log(`[SET_CREATE ${requestId}] Set created successfully:`, { 
      set_id: set.set_id, 
      set_name: set.set_name,
      user_id: set.user_id,
      category: set.category
    });

    const response = NextResponse.json({ 
      message: 'Set created successfully', 
      set: {
        set_id: set.set_id,
        set_name: set.set_name,
        set_subject: set.set_subject,
        description: set.description,
        category: set.category,
        posted: set.posted,
        number_of_cards: createdCards.length,
        date_created: set.date_created,
        cards: createdCards,
      }
    }, { status: 201 });
    return addCorsHeaders(response, req.headers.get('origin'));
    
  } catch (error: any) {
    // Enhanced error logging
    logError('GENERAL', error, {
      requestId,
      requestMethod: req.method,
      requestUrl: req.url,
      requestHeaders: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString(),
    });
    
    let errorMessage = 'Set creation failed';
    let statusCode = 500;
    
    // Handle specific error types
    if (error?.code === 'P2002') {
      // Prisma unique constraint error
      const field = error.meta?.target?.join(', ') || 'field';
      errorMessage = `Set with this ${field} already exists.`;
      statusCode = 409; // Conflict
    } else if (error?.code === 'P2025') {
      // Record not found
      errorMessage = 'User not found';
      statusCode = 404;
    } else if (error?.code === 'P2003') {
      // Foreign key constraint failed
      errorMessage = 'Invalid user reference';
      statusCode = 400;
    } else if (error?.message?.includes('connect')) {
      // Database connection error
      errorMessage = 'Database connection failed';
      statusCode = 503;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    console.log(`[SET_CREATE ${requestId}] Returning error response:`, {
      statusCode,
      errorMessage,
      originalError: error?.message
    });
    
    const response = NextResponse.json({ 
      error: errorMessage,
      requestId 
    }, { status: statusCode });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
}