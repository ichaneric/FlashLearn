// File: generate/route.ts
// Description: API endpoint for AI-powered flashcard generation using DeepSeek V3

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { deepseekService  } from '@/lib/deepseekService';

// CORS headers helper
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Error logging utility
function logError(type: string, error: Error, context: any = {}) {
  console.error(`[FLASHCARD_GENERATE] ${type}:`, {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Verifies JWT token and returns decoded payload
 * @param token - JWT token to verify
 * @returns Decoded token or null if invalid
 */
const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    return decoded;
  } catch (error) {
    console.error('[FLASHCARD_GENERATE] Token verification failed:', error);
    return null;
  }
};

/**
 * AI-powered flashcard generation interface
 */
interface FlashcardData {
  question: string;
  answer: string;
}

interface GenerationRequest {
  subject: string;
  topic: string;
  cardCount: number;
}

interface GenerationResult {
  success: boolean;
  cards?: FlashcardData[];
  warning?: string;
  error?: string;
}

// DeepSeek V3 integration is handled by the imported service

// Handle CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

// Main POST endpoint for flashcard generation
export async function POST(req: NextRequest) {
  const requestId = uuidv4().substring(0, 8);
  console.log(`[FLASHCARD_GENERATE ${requestId}] POST request received`);
  
  try {
    // Extract and verify token (allow test tokens for development)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      logError('AUTH_HEADER_MISSING', new Error('Authorization header missing'), { requestId });
      const response = NextResponse.json({ 
        error: 'Authorization header missing' 
      }, { status: 401 });
      return addCorsHeaders(response);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logError('TOKEN_MISSING', new Error('Bearer token missing'), { requestId });
      const response = NextResponse.json({ 
        error: 'Bearer token missing' 
      }, { status: 401 });
      return addCorsHeaders(response);
    }

    // Allow test tokens for development/testing
    let decoded = null;
    if (token === 'test-token') {
      decoded = { user_id: 'test-user' }; // Mock user for testing
      console.log(`[FLASHCARD_GENERATE ${requestId}] Using test token for development`);
    } else {
      decoded = verifyToken(token);
      if (!decoded) {
        logError('TOKEN_INVALID', new Error('Invalid or expired token'), { requestId });
        const response = NextResponse.json({ 
          error: 'Invalid or expired token' 
        }, { status: 401 });
        return addCorsHeaders(response);
      }
    }

    // Parse request body
    const body = await req.json();
    const { subject, topic, cardCount } = body;
    
    console.log(`[FLASHCARD_GENERATE ${requestId}] Request data:`, { 
      subject,
      topic,
      cardCount
    });

    // Validate required fields
    if (!subject || !topic || !cardCount) {
      const response = NextResponse.json({ 
        error: 'Missing required fields: subject, topic, and cardCount are required' 
      }, { status: 400 });
      return addCorsHeaders(response);
    }

    // Generate flashcards using DeepSeek V3 service
    const result = await deepseekService.generateFlashcards({
      subject: subject.trim(),
      topic: topic.trim(),
      cardCount: parseInt(cardCount, 10) || 5
    });

    console.log(`[FLASHCARD_GENERATE ${requestId}] Generation result:`, {
      success: result.success,
      cardsGenerated: result.cards?.length || 0,
      hasWarning: !!result.warning,
      hasError: !!result.error
    });

    const response = NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });
    return addCorsHeaders(response);

  } catch (error: any) {
    logError('GENERATION_FAILED', error, { requestId });
    const response = NextResponse.json({ 
      error: 'Internal server error during flashcard generation',
      details: error.message 
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}
