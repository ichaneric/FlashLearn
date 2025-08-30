// File: route.ts
// Description: Serves default avatar images from assets directory

import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';
import fs from 'fs';
import path from 'path';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Validate filename to prevent directory traversal
    if (!filename || !/^[1-9]|10\.jpg$/.test(filename)) {
      const response = NextResponse.json({ error: 'Invalid avatar filename' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    // Path to avatar images in assets
    const avatarPath = path.join(process.cwd(), 'assets', 'images', filename);
    
    // Check if file exists
    if (!fs.existsSync(avatarPath)) {
      const response = NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(avatarPath);
    
    // Return the image with proper headers
    const response = new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
    
    return addCorsHeaders(response, req.headers.get('origin'));
    
  } catch (error) {
    console.error('[AVATAR] Error serving avatar:', error);
    const response = NextResponse.json({ error: 'Failed to serve avatar' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
}
