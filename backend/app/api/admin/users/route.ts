// File: backend/app/api/admin/users/route.ts
// Description: Admin users API endpoint providing user management data

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

const prisma = new PrismaClient();

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
      console.error('[GET admin/users] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      console.error('[GET admin/users] Error: Access denied - User is not admin');
      const response = NextResponse.json({ error: 'Access denied' }, { status: 403 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Get all users with their statistics
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        educational_level: true,
        // date_created field doesn't exist in User model
        isAdmin: true,
        profile: true,
        sets: {
          where: { posted: true },
          select: {
            _count: {
              select: { savedBy: true }
            }
          }
        },
        savedSets: {
          select: {
            saved_at: true
          },
          orderBy: {
            saved_at: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        username: 'asc'
      }
    });

    // Process user data to include statistics
    const processedUsers = users.map(user => {
      const sets_count = user.sets.length;
      const total_learners = user.sets.reduce((total, set) => total + set._count.savedBy, 0);
      
      // Use the most recent saved set activity as last_activity, or current date as fallback
      const last_activity = user.savedSets.length > 0 
        ? user.savedSets[0].saved_at 
        : new Date();

      return {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        educational_level: user.educational_level,
        date_created: last_activity, // Use last_activity as date_created for now
        isAdmin: user.isAdmin,
        profileImageUrl: user.profile, // Map profile to profileImageUrl for frontend compatibility
        sets_count,
        total_learners,
        last_activity
      };
    });

    console.log('[GET admin/users] Users data retrieved successfully');

    const response = NextResponse.json(processedUsers);
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET admin/users] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const decoded = extractAndVerifyToken(authHeader);
  if (!decoded || !decoded.isAdmin) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return addCorsHeaders(response, req.headers.get('origin'));
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    await prisma.inbox.deleteMany({ where: { OR: [{ sender_id: user_id }, { receiver_id: user_id }] } });
    await prisma.set.deleteMany({ where: { user_id } });
    await prisma.card.deleteMany({ where: { set: { user_id } } });
    await prisma.user.delete({ where: { user_id } });

    const response = NextResponse.json({ message: 'User deleted' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error(error);
    const response = NextResponse.json({ error: 'Deletion failed' }, { status: 400 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}