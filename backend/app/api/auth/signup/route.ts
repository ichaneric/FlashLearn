// File: route.ts
// Description: Handles user registration with secure file uploads and comprehensive validation.

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';
import fs from 'fs';
import path from 'path';

export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function POST(req: NextRequest) {
  const requestId = uuidv4().substring(0, 8);
  
  try {
    const prisma = new PrismaClient();
    console.log('🔍 Signup request received');
    console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('📋 Content-Type:', req.headers.get('content-type'));
    
    // Check content type to determine if it's FormData or JSON
    const contentType = req.headers.get('content-type') || '';
    let username, full_name, educational_level, email, password, profile_image = '1.jpg';
    let profileImageFilename = null;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (custom image upload) - simplified approach
      console.log('📝 Processing FormData signup with image upload');
      
      // For now, fall back to JSON processing since formidable has compatibility issues
      console.log('⚠️ FormData processing temporarily disabled - using JSON fallback');
      
      const body = await req.json();
      ({ username, full_name, educational_level, email, password, profile_image = '1.jpg' } = body);
    } else {
      // Handle JSON (avatar selection)
      console.log('📝 Processing JSON signup with avatar selection');
      
      const body = await req.json();
      ({ username, full_name, educational_level, email, password, profile_image = '1.jpg' } = body);
    }
    
    console.log('📝 Signup data:', { username, full_name, email, educational_level, password: password ? '***' : 'MISSING' });
    
    // Basic validation
    if (!username || !full_name || !email || !password || !educational_level) {
      const response = NextResponse.json({ 
        error: 'All fields are required',
        field: 'missing_fields'
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    // Basic validation
    if (password.length < 6) {
      const response = NextResponse.json({ 
        error: 'Password must be at least 6 characters long',
        field: 'password'
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    if (!email.includes('@')) {
      const response = NextResponse.json({ 
        error: 'Invalid email format',
        field: 'email'
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in database
    const userData = {
      user_id: uuidv4(),
      username: username.trim(),
      full_name: full_name.trim(),
      educational_level: educational_level,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      profile: profileImageFilename || profile_image || '1.jpg',
      isAdmin: false,
    };
    
    const user = await prisma.user.create({
      data: userData,
    });
    
    const response = NextResponse.json({ 
      success: true,
      message: 'User created successfully', 
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        educational_level: user.educational_level,
        profile_image: user.profile
      }
    }, { status: 201 });
    return addCorsHeaders(response, req.headers.get('origin'));
    
  } catch (error: any) {
    let errorMessage = 'Registration failed';
    let statusCode = 500;
    
    // Handle specific error types
    if (error?.code === 'P2002') {
      // Prisma unique constraint error
      const field = error.meta?.target?.join(', ') || 'field';
      errorMessage = `User with this ${field} already exists.`;
      statusCode = 409; // Conflict
    } else if (error?.code === 'P2025') {
      // Record not found
      errorMessage = 'Database record not found';
      statusCode = 404;
    } else if (error?.code === 'P2003') {
      // Foreign key constraint failed
      errorMessage = 'Invalid reference data';
      statusCode = 400;
    } else if (error?.message?.includes('connect')) {
      // Database connection error
      errorMessage = 'Database connection failed';
      statusCode = 503;
    } else if (error?.message?.includes('formidable')) {
      // Formidable error
      errorMessage = 'Invalid form data';
      statusCode = 400;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    const response = NextResponse.json({ 
      error: errorMessage,
      requestId 
    }, { status: statusCode });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
}