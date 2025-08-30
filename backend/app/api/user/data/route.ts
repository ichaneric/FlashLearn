// File: route.ts
// Description: Handles user data operations with secure JWT validation and comprehensive error handling

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Enhanced logging function
function logError(step: string, error: any, additionalData?: any) {
  console.error(`[USER_DATA ERROR] ${step}:`, {
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
  console.log('[USER_DATA] OPTIONS request received');
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function GET(req: NextRequest) {
  const requestId = uuidv4().substring(0, 8);
  console.log(`[USER_DATA ${requestId}] GET request received`);
  
  try {
    // Log request details
    console.log(`[USER_DATA ${requestId}] Request headers:`, {
      'authorization': req.headers.get('authorization') ? '[PRESENT]' : '[MISSING]',
      'user-agent': req.headers.get('user-agent'),
      'origin': req.headers.get('origin'),
    });

    // Extract and verify token using secure utility
    console.log(`[USER_DATA ${requestId}] Extracting authorization token...`);
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
    console.log(`[USER_DATA ${requestId}] Token verified for user_id:`, userId);

    // Fetch user data
    console.log(`[USER_DATA ${requestId}] Fetching user data for user_id:`, userId);
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { 
        user_id: true,
        username: true,
        full_name: true, 
        email: true, 
        educational_level: true, 
        profile: true,
        isAdmin: true,
        sets: { select: { set_id: true } }, // Get sets for count
      },
    });

    if (!user) {
      console.log(`[USER_DATA ${requestId}] User not found in database:`, userId);
      const response = NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Calculate sets_count
    const sets_count = user.sets ? user.sets.length : 0;

    console.log(`[USER_DATA ${requestId}] User data retrieved successfully:`, {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      educational_level: user.educational_level,
      isAdmin: user.isAdmin
    });

    // Build profile image URL
    let profileImageUrl = null;
    let profileUrl = null;
    if (user.profile) {
      // Check if it's a default avatar (avatar_1.jpg, avatar_2.jpg, etc. or 1.jpg, 2.jpg, etc.)
      if (user.profile.startsWith('avatar_') || /^[1-9]\.jpg$|^10\.jpg$/.test(user.profile)) {
        // For default avatars, return just the filename
        // The frontend will use the local asset mapping
        profileImageUrl = user.profile;
      } else if (user.profile.includes('_') || user.profile.includes('@')) {
        // For custom uploaded images (contains underscore or email pattern), return both filename and full URL
        profileImageUrl = user.profile;
        // Use the network IP address that mobile app can reach
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://192.168.254.104:3001';
        profileUrl = `${baseUrl}/api/uploads/${user.profile}`;
      } else {
        // For any other case, treat as default avatar
        profileImageUrl = user.profile;
      }
    }

    const response = NextResponse.json({
      id: user.user_id,
      username: user.username,
      email: user.email,
      educationalLevel: user.educational_level,
      profileImageUrl: profileImageUrl,
      profileUrl: profileUrl, // Full URL for uploaded images
      full_name: user.full_name,
      profile: user.profile, // Keep for backward compatibility
      isAdmin: user.isAdmin,
      sets_count,
      message: 'User data retrieved successfully'
    });
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
    
    let errorMessage = 'Failed to fetch user data';
    let statusCode = 500;
    
    // Handle specific error types
    if (error?.code === 'P2025') {
      // Record not found
      errorMessage = 'User not found';
      statusCode = 404;
    } else if (error?.code === 'P2003') {
      // Foreign key constraint failed
      errorMessage = 'Invalid reference data';
      statusCode = 400;
    } else if (error?.message?.includes('connect')) {
      // Database connection error
      errorMessage = 'Database connection failed';
      statusCode = 503;
    } else if (error?.message?.includes('jwt')) {
      // JWT error
      errorMessage = 'Token verification failed';
      statusCode = 401;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    console.log(`[USER_DATA ${requestId}] Returning error response:`, {
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

/**
 * Updates user profile data (PUT /api/user/data)
 */
export async function PUT(req: NextRequest) {
  const requestId = uuidv4().substring(0, 8);
  console.log(`[USER_DATA ${requestId}] PUT request received`);
  
  try {
    // Log request details
    console.log(`[USER_DATA ${requestId}] Request headers:`, {
      'authorization': req.headers.get('authorization') ? '[PRESENT]' : '[MISSING]',
      'user-agent': req.headers.get('user-agent'),
      'origin': req.headers.get('origin'),
    });

    // Extract and verify token using secure utility
    console.log(`[USER_DATA ${requestId}] Extracting authorization token...`);
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
    console.log(`[USER_DATA ${requestId}] Token verified for user_id:`, userId);

    // Parse request body
    console.log(`[USER_DATA ${requestId}] Parsing request body...`);
    const body = await req.json();
    console.log(`[USER_DATA ${requestId}] Request body:`, body);

    // Validate request body
    if (!body || typeof body !== 'object') {
      logError('INVALID_BODY', new Error('Invalid request body'), { requestId, body });
      const response = NextResponse.json({ 
        error: 'Invalid request body' 
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Extract updateable fields
    const { full_name, email, educational_level, profile, password } = body;
    
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (full_name !== undefined) {
      if (typeof full_name !== 'string') {
        const response = NextResponse.json({ 
          error: 'Full name must be a string' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
      updateData.full_name = full_name.trim() || 'User';
    }
    
    if (email !== undefined) {
      if (typeof email !== 'string') {
        const response = NextResponse.json({ 
          error: 'Email must be a string' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail && !trimmedEmail.includes('@')) {
        const response = NextResponse.json({ 
          error: 'Email must be a valid email address' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
      updateData.email = trimmedEmail;
    }
    
    if (educational_level !== undefined) {
      const validLevels = ['elementary', 'junior_highschool', 'senior_highschool', 'college'];
      if (!validLevels.includes(educational_level)) {
        const response = NextResponse.json({ 
          error: 'Invalid educational level' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
      updateData.educational_level = educational_level;
    }
    
    if (profile !== undefined) {
      if (typeof profile !== 'string') {
        const response = NextResponse.json({ 
          error: 'Profile must be a string' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
      updateData.profile = profile.trim() || '1.jpg';
    }
    
    if (password !== undefined && password !== '') {
      if (typeof password !== 'string') {
        const response = NextResponse.json({ 
          error: 'Password must be a string' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
      if (password.length < 6) {
        const response = NextResponse.json({ 
          error: 'Password must be at least 6 characters long' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
      // Hash the password before saving
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      console.log(`[USER_DATA ${requestId}] No valid fields to update`);
      const response = NextResponse.json({ 
        error: 'No valid fields to update' 
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check for email uniqueness if email is being updated
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          user_id: { not: userId }
        }
      });
      
      if (existingUser) {
        console.log(`[USER_DATA ${requestId}] Email already exists:`, updateData.email);
        const response = NextResponse.json({ 
          error: 'Email already exists' 
        }, { status: 409 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
    }

    // Update user data
    console.log(`[USER_DATA ${requestId}] Updating user data:`, updateData);
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      select: { 
        user_id: true,
        username: true,
        full_name: true, 
        email: true, 
        educational_level: true, 
        profile: true,
        isAdmin: true,
      },
    });

    console.log(`[USER_DATA ${requestId}] User updated successfully:`, {
      user_id: updatedUser.user_id,
      username: updatedUser.username,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      educational_level: updatedUser.educational_level,
      profile: updatedUser.profile
    });

    // Build profile image URL for updated user
    let profileImageUrl = null;
    if (updatedUser.profile) {
      // Check if it's a default avatar (avatar_1.jpg, avatar_2.jpg, etc. or 1.jpg, 2.jpg, etc.)
      if (updatedUser.profile.startsWith('avatar_') || /^[1-9]\.jpg$|^10\.jpg$/.test(updatedUser.profile)) {
        // For default avatars, return just the filename
        // The frontend will use the local asset mapping
        profileImageUrl = updatedUser.profile;
      } else if (updatedUser.profile.includes('_') || updatedUser.profile.includes('@')) {
        // For custom uploaded images (contains underscore or email pattern), return just the filename
        // The frontend will prepend the uploads URL
        profileImageUrl = updatedUser.profile;
      } else {
        // For any other case, treat as default avatar
        profileImageUrl = updatedUser.profile;
      }
    }

    const response = NextResponse.json({
      id: updatedUser.user_id,
      username: updatedUser.username,
      email: updatedUser.email,
      educationalLevel: updatedUser.educational_level,
      profileImageUrl: profileImageUrl,
      full_name: updatedUser.full_name,
      profile: updatedUser.profile, // Keep for backward compatibility
      isAdmin: updatedUser.isAdmin,
      message: 'Profile updated successfully'
    });
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
    
    let errorMessage = 'Failed to update user data';
    let statusCode = 500;
    
    // Handle specific error types
    if (error?.code === 'P2025') {
      // Record not found
      errorMessage = 'User not found';
      statusCode = 404;
    } else if (error?.code === 'P2002') {
      // Unique constraint failed
      errorMessage = 'Email already exists';
      statusCode = 409;
    } else if (error?.code === 'P2003') {
      // Foreign key constraint failed
      errorMessage = 'Invalid reference data';
      statusCode = 400;
    } else if (error?.message?.includes('connect')) {
      // Database connection error
      errorMessage = 'Database connection failed';
      statusCode = 503;
    } else if (error?.message?.includes('jwt')) {
      // JWT error
      errorMessage = 'Token verification failed';
      statusCode = 401;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    console.log(`[USER_DATA ${requestId}] Returning error response:`, {
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