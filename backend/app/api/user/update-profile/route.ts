// File: route.ts
// Description: Handles user profile updates with image uploads using multipart/form-data

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Enhanced logging function
function logError(step: string, error: any, additionalData?: any) {
  console.error(`[UPDATE_PROFILE ERROR] ${step}:`, {
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
  console.log('[UPDATE_PROFILE] OPTIONS request received');
  return createCorsPreflightResponse(req.headers.get('origin'));
}

/**
 * Updates user profile with image upload support (PUT /api/user/update-profile)
 */
export async function PUT(req: NextRequest) {
  const requestId = uuidv4().substring(0, 8);
  console.log(`[UPDATE_PROFILE ${requestId}] PUT request received`);
  
  try {
    // Log request details
    console.log(`[UPDATE_PROFILE ${requestId}] Request headers:`, {
      'authorization': req.headers.get('authorization') ? '[PRESENT]' : '[MISSING]',
      'content-type': req.headers.get('content-type'),
      'user-agent': req.headers.get('user-agent'),
      'origin': req.headers.get('origin'),
    });

    // Extract and verify token using secure utility
    console.log(`[UPDATE_PROFILE ${requestId}] Extracting authorization token...`);
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
    console.log(`[UPDATE_PROFILE ${requestId}] Token verified for user_id:`, userId);

    // Check if request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      logError('INVALID_CONTENT_TYPE', new Error('Content-Type must be multipart/form-data'), { requestId, contentType });
      const response = NextResponse.json({ 
        error: 'Content-Type must be multipart/form-data' 
      }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Parse multipart form data using native FormData
    console.log(`[UPDATE_PROFILE ${requestId}] Parsing multipart form data...`);
    const formData = await req.formData();
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`[UPDATE_PROFILE ${requestId}] Created uploads directory:`, uploadsDir);
    }

    // Extract form fields
    const full_name = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const educational_level = formData.get('educational_level') as string;
    const password = formData.get('password') as string;
    const profileImage = formData.get('profileImage') as File | null;

         console.log(`[UPDATE_PROFILE ${requestId}] Form data extracted:`, {
       hasFullName: !!full_name,
       hasEducationalLevel: !!educational_level,
       hasPassword: !!password,
       hasProfileImage: !!profileImage,
       profile: formData.get('profile'),
     });

    // Handle profile image upload
    let profileImageFilename = null;
    
    if (profileImage) {
      console.log(`[UPDATE_PROFILE ${requestId}] Processing uploaded image:`, {
        name: profileImage.name,
        size: profileImage.size,
        type: profileImage.type,
      });

      // Validate file size (25MB limit)
      const maxSize = 25 * 1024 * 1024; // 25MB in bytes
      if (profileImage.size > maxSize) {
        logError('FILE_TOO_LARGE', new Error('File size exceeds 25MB limit'), { requestId, size: profileImage.size, maxSize });
        const response = NextResponse.json({ 
          error: 'File size must be less than 25MB' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }

      // Validate file type
      if (!profileImage.type || (!profileImage.type.includes('jpeg') && !profileImage.type.includes('jpg') && !profileImage.type.includes('png'))) {
        logError('INVALID_FILE_TYPE', new Error('Only JPG and PNG files are allowed'), { requestId, type: profileImage.type });
        const response = NextResponse.json({ 
          error: 'Only JPG and PNG files are allowed' 
        }, { status: 400 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }

      // Get user data for filename generation
      const currentUser = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { username: true, email: true, profile: true },
      });

      if (!currentUser) {
        logError('USER_NOT_FOUND', new Error('User not found for filename generation'), { requestId, userId });
        const response = NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }

      // Generate filename using username_email format
      const sanitizeFilename = (str: string) => {
        return str.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      };

      const username = sanitizeFilename(currentUser.username || 'user');
      const emailPart = currentUser.email ? sanitizeFilename(currentUser.email.split('@')[0]) : 'email';
      const extension = path.extname(profileImage.name || 'image.jpg');
      const timestamp = Date.now();
      
      // Format: username_email_timestamp.ext
      profileImageFilename = `${username}_${emailPart}_${timestamp}${extension}`;
      
      console.log(`[UPDATE_PROFILE ${requestId}] Generated filename:`, profileImageFilename);
      
      // Convert File to Buffer and save
      const arrayBuffer = await profileImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const finalPath = path.join(uploadsDir, profileImageFilename);
      fs.writeFileSync(finalPath, buffer);
      
      console.log(`[UPDATE_PROFILE ${requestId}] Image saved:`, {
        finalPath,
        filename: profileImageFilename,
        size: buffer.length,
      });

      // Delete old profile image if it exists and is different
      if (currentUser.profile && currentUser.profile !== profileImageFilename) {
        const oldImagePath = path.join(uploadsDir, currentUser.profile);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`[UPDATE_PROFILE ${requestId}] Deleted old profile image:`, oldImagePath);
        }
      }
    }

         // Build update object
     const updateData: any = {};
     
     if (full_name !== undefined && full_name !== null) {
       updateData.full_name = full_name.trim() || 'User';
     }
     
     if (educational_level !== undefined && educational_level !== null) {
       const validLevels = ['elementary', 'junior_highschool', 'senior_highschool', 'college'];
       if (!validLevels.includes(educational_level)) {
         const response = NextResponse.json({ 
           error: 'Invalid educational level' 
         }, { status: 400 });
         return addCorsHeaders(response, req.headers.get('origin'));
       }
       updateData.educational_level = educational_level;
     }
     
     // Handle profile updates (both uploaded images and default avatars)
     const profile = formData.get('profile') as string;
     if (profile) {
       // Check if it's a default avatar (1-10.jpg) or custom uploaded image
       if (profileImageFilename) {
         // Custom uploaded image
         updateData.profile = profileImageFilename;
       } else if (profile.match(/^[1-9]|10\.jpg$/)) {
         // Default avatar selection
         updateData.profile = profile;
       }
     }
    
    if (password !== undefined && password !== null && password !== '') {
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
      console.log(`[UPDATE_PROFILE ${requestId}] No valid fields to update`);
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
        console.log(`[UPDATE_PROFILE ${requestId}] Email already exists:`, updateData.email);
        const response = NextResponse.json({ 
          error: 'Email already exists' 
        }, { status: 409 });
        return addCorsHeaders(response, req.headers.get('origin'));
      }
    }

    // Update user data
    console.log(`[UPDATE_PROFILE ${requestId}] Updating user data:`, updateData);
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

    console.log(`[UPDATE_PROFILE ${requestId}] User updated successfully:`, {
      user_id: updatedUser.user_id,
      username: updatedUser.username,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      educational_level: updatedUser.educational_level,
      profile: updatedUser.profile
    });

               // Build profile URL for response
      let profileUrl = null;
      let profileImageUrl = null;
      if (updatedUser.profile) {
        // Use the network IP address that mobile app can reach
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://192.168.254.104:3001';
        profileUrl = `${baseUrl}/api/uploads/${updatedUser.profile}`;
        profileImageUrl = updatedUser.profile; // Store filename for frontend
      }

     const response = NextResponse.json({
       id: updatedUser.user_id,
       username: updatedUser.username,
       email: updatedUser.email,
       educationalLevel: updatedUser.educational_level,
       profileUrl: profileUrl,
       profileImageUrl: profileImageUrl, // Add this for frontend compatibility
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
    
    let errorMessage = 'Failed to update profile';
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
    } else if (error?.message?.includes('FormData')) {
      // FormData error
      errorMessage = 'Invalid form data';
      statusCode = 400;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    console.log(`[UPDATE_PROFILE ${requestId}] Returning error response:`, {
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
