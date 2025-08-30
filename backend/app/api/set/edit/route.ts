// File: route.ts
// Description: Handles set/edit operations with secure JWT validation

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken  } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse  } from '@/lib/corsUtils';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function GET(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[GET set/edit] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET set/edit] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[POST set/edit] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[POST set/edit] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('[PUT set/edit] Updating set...');
    
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[PUT set/edit] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const userId = (decoded as any).user_id;
    const { set_id, set_name, set_subject, category, posted } = await req.json();
    
    console.log('[PUT set/edit] Request data:', { set_id, set_name, set_subject, category, posted });
    
    if (!set_id) {
      const response = NextResponse.json({ error: 'Missing set_id' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check if set exists and user owns it
    const set = await prisma.set.findUnique({ where: { set_id } });
    if (!set) {
      console.error('[PUT set/edit] Set not found:', set_id);
      const response = NextResponse.json({ error: 'Set not found' }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }
    
    if (set.user_id !== userId) {
      console.error('[PUT set/edit] Unauthorized access - user', userId, 'trying to edit set', set_id, 'owned by', set.user_id);
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Prepare update data
    const updateData: any = {};
    if (set_name !== undefined) updateData.set_name = set_name.trim();
    if (set_subject !== undefined) updateData.set_subject = set_subject.trim();
    if (category !== undefined) updateData.category = category;
    if (posted !== undefined) {
      updateData.posted = posted;
      // Also update status to match posted state
      updateData.status = posted ? 'published' : 'draft';
    }

    console.log('[PUT set/edit] Updating set with data:', updateData);

    const updatedSet = await prisma.set.update({
      where: { set_id },
      data: updateData,
    });

    console.log('[PUT set/edit] Set updated successfully:', set_id);
    const response = NextResponse.json({ 
      message: 'Set updated successfully', 
      set: updatedSet 
    });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[PUT set/edit] Error:', error);
    const response = NextResponse.json({ error: 'Failed to update set' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[DELETE set/edit] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[DELETE set/edit] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}