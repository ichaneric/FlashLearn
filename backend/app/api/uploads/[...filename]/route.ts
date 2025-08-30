// File: route.ts
// Description: Serves uploaded profile images from the public/uploads directory

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Serves uploaded profile images
 * GET /api/uploads/[filename]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    // Join the filename parts (handles nested paths)
    const filename = params.filename.join('/');
    
    // Security: Prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    // Construct the file path
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    console.log('[UPLOADS] Requested file:', filename);
    console.log('[UPLOADS] File path:', filePath);
    console.log('[UPLOADS] File exists:', fs.existsSync(filePath));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('[UPLOADS] File not found:', filePath);
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    console.log('[UPLOADS] File size:', fileBuffer.length, 'bytes');
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }
    
    console.log('[UPLOADS] Serving file with content type:', contentType);
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('[UPLOADS] Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
