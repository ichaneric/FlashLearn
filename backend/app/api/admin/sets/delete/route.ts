// File: backend/app/api/admin/sets/delete/route.ts
// Description: Admin delete set API endpoint allowing admins to delete any set

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

const prisma = new PrismaClient();

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function PUT(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[PUT admin/sets/delete] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      console.error('[PUT admin/sets/delete] Error: Access denied - User is not admin');
      const response = NextResponse.json({ error: 'Access denied' }, { status: 403 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    const { set_id } = await req.json();
    
    if (!set_id) {
      const response = NextResponse.json({ error: 'Set ID is required' }, { status: 400 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check if set exists
    const existingSet = await prisma.set.findUnique({
      where: { set_id: set_id },
      select: { set_name: true }
    });

    if (!existingSet) {
      const response = NextResponse.json({ error: 'Set not found' }, { status: 404 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Delete all saved sets first (cascade)
    await prisma.setSave.deleteMany({
      where: { set_id: set_id }
    });

    // Delete all cards associated with the set
    await prisma.card.deleteMany({
      where: { set_id: set_id }
    });

    // Delete the set
    await prisma.set.delete({
      where: { set_id: set_id }
    });

    console.log('[PUT admin/sets/delete] Set deleted successfully:', set_id);
    
    const response = NextResponse.json({ 
      success: true,
      message: 'Set deleted successfully' 
    });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[PUT admin/sets/delete] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}
