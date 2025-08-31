// File: backend/app/api/admin/dashboard/route.ts
// Description: Admin dashboard API endpoint providing KPI data and analytics

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/singleton';
import { extractAndVerifyToken } from '@/lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '@/lib/corsUtils';

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
      console.error('[GET admin/dashboard] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      console.error('[GET admin/dashboard] Error: Access denied - User is not admin');
      const response = NextResponse.json({ error: 'Access denied' }, { status: 403 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Get current date and calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get active users (users who have created sets or saved sets)
    const activeUsersToday = await prisma.user.count({
      where: {
        OR: [
          { sets: { some: { date_created: { gte: today } } } },
          { savedSets: { some: { saved_at: { gte: today } } } }
        ]
      }
    });

    const activeUsersWeek = await prisma.user.count({
      where: {
        OR: [
          { sets: { some: { date_created: { gte: weekAgo } } } },
          { savedSets: { some: { saved_at: { gte: weekAgo } } } }
        ]
      }
    });

    // Get total sets and cards
    const totalSets = await prisma.set.count();
    const totalCards = await prisma.card.count();

    // Get user growth data (last 7 days) - simplified for now
    const userGrowth = [];
    const totalUsersCount = await prisma.user.count();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      
      // For now, distribute users evenly across days since User model doesn't have date_created
      // This can be enhanced when we add date_created field to User model
      const estimatedCount = Math.floor(totalUsersCount * (i + 1) / 7);
      
      userGrowth.push({
        date: date.toISOString().split('T')[0],
        count: Math.max(estimatedCount, 1) // Ensure at least 1 user
      });
    }

    // Get set creation trend (last 7 days)
    const setCreationTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const count = await prisma.set.count({
        where: {
          date_created: {
            gte: date,
            lt: nextDate
          }
        }
      });
      
      setCreationTrend.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    // Get top creators by learners - simplified query
    const topCreators = await prisma.user.findMany({
      where: {
        sets: {
          some: {
            posted: true
          }
        }
      },
      select: {
        username: true,
        sets: {
          where: { posted: true },
          select: {
            _count: {
              select: { savedBy: true }
            }
          }
        }
      },
      take: 10
    });

    const topCreatorsFormatted = topCreators.map(creator => ({
      username: creator.username,
      learners: creator.sets.reduce((total, set) => total + set._count.savedBy, 0),
      sets: creator.sets.length
    })).sort((a, b) => b.learners - a.learners).slice(0, 5);

    // Get top sets by learners - simplified query
    const topSets = await prisma.set.findMany({
      where: { posted: true },
      select: {
        set_name: true,
        user: {
          select: { username: true }
        },
        _count: {
          select: { savedBy: true }
        }
      },
      take: 5
    });

    const topSetsFormatted = topSets.map(set => ({
      set_name: set.set_name,
      creator: set.user.username,
      learners: set._count.savedBy
    })).sort((a, b) => b.learners - a.learners);

    console.log('[GET admin/dashboard] Dashboard data retrieved successfully');

    const response = NextResponse.json({
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      totalSets,
      totalCards,
      userGrowth,
      setCreationTrend,
      topCreators: topCreatorsFormatted,
      topSets: topSetsFormatted
    });

    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET admin/dashboard] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  }
}
