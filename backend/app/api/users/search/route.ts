import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken  } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse  } from '@/lib/corsUtils';

export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const decoded = extractAndVerifyToken(authHeader);
  if (!decoded) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
  try {
    const currentUserId = (decoded as any).user_id;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const users = await prisma.user.findMany({
      where: {
        user_id: { not: currentUserId },
        OR: [
          { full_name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        user_id: true,
        full_name: true,
        username: true,
        profile: true,
        friends: { select: { user_id: true } },
      },
    });
    const currentUser = await prisma.user.findUnique({
      where: { user_id: currentUserId },
      select: { friends: { select: { user_id: true } } },
    });
    const result = users.map(user => {
      let status = 'none';
      if (currentUser?.friends.some(f => f.user_id === user.user_id)) status = 'friend';
      // TODO: Add logic for 'pending' if you have a pending request system
      return {
        user_id: user.user_id,
        full_name: user.full_name,
        username: user.username,
        profile_image: user.profile ? `/assets/images/${user.profile}` : '',
        status,
      };
    });
    const response = NextResponse.json(result);
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error(error);
    const response = NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
} 