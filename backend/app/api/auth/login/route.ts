// File: route.ts
// Description: Handles user authentication login with secure JWT and comprehensive validation.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { signToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';
import { validateEmail, validatePassword } from '@/lib/validationUtils';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function POST(req: NextRequest) {
  const requestId = uuidv4().substring(0, 8);
  
  try {
    // Parse request body
    const body = await req.json();
    const { email, password } = body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      const response = NextResponse.json({ 
        error: emailValidation.error,
        field: 'email'
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const response = NextResponse.json({ 
        error: passwordValidation.error,
        field: 'password'
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email: emailValidation.sanitized! } 
    });
    
    if (!user) {
      const response = NextResponse.json({ 
        error: 'Invalid credentials' 
      }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      const response = NextResponse.json({ 
        error: 'Invalid credentials' 
      }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Generate secure JWT token
    const token = signToken({
      user_id: user.user_id, 
      isAdmin: user.isAdmin,
      username: user.username 
    });

    const response = NextResponse.json({ 
      token, 
      user_id: user.user_id, 
      isAdmin: user.isAdmin,
      username: user.username,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        educational_level: user.educational_level,
        profile_image: user.profile
      },
      message: 'Login successful'
    });
    return addCorsHeaders(response, req.headers.get('origin'));
    
  } catch (error: unknown) {
    let errorMessage = 'Login failed';
    let statusCode = 500;
    
    // Handle specific error types
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2025') {
        errorMessage = 'User not found';
        statusCode = 404;
      } else if (error.code === 'P2003') {
        errorMessage = 'Invalid reference data';
        statusCode = 400;
      }
    }
    
    if (error instanceof Error) {
      if (error.message?.includes('connect')) {
        errorMessage = 'Database connection failed';
        statusCode = 503;
      } else if (error.message?.includes('jwt')) {
        errorMessage = 'Token generation failed';
        statusCode = 500;
      } else {
        errorMessage = error.message;
      }
    }
    
    const response = NextResponse.json({ 
      error: errorMessage,
      requestId 
    }, { status: statusCode });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
}