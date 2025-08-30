// File: backend/app/api/admin/analytics/route.ts
// Description: Admin analytics API endpoint providing subject analytics and engagement metrics

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
      console.error('[GET admin/analytics] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      console.error('[GET admin/analytics] Error: Access denied - User is not admin');
      const response = NextResponse.json({ error: 'Access denied' }, { status: 403 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // Get all sets grouped by subject
    const setsBySubject = await prisma.set.groupBy({
      by: ['set_subject'],
      where: {
        posted: true
      },
      _count: {
        set_id: true
      },
      _sum: {
        number_of_cards: true
      }
    });

    // Get total engagement across all sets
    const totalEngagement = await prisma.setSave.count();

    // Calculate subject analytics
    const subjectAnalytics = await Promise.all(
      setsBySubject.map(async (subject) => {
        const sets = await prisma.set.findMany({
          where: {
            set_subject: subject.set_subject,
            posted: true
          },
                      select: {
              _count: {
                select: { savedBy: true }
              }
            }
        });

        const totalLearners = sets.reduce((sum, set) => sum + set._count.savedBy, 0);
        const engagementRate = totalEngagement > 0 ? (totalLearners / totalEngagement) * 100 : 0;

        return {
          subject: subject.set_subject || 'General',
          sets_count: subject._count.set_id,
          total_learners: totalLearners,
          engagement_rate: engagementRate
        };
      })
    );

    // Sort by engagement rate
    subjectAnalytics.sort((a, b) => b.engagement_rate - a.engagement_rate);

    // Calculate overall statistics
    const averageEngagement = subjectAnalytics.length > 0 
      ? subjectAnalytics.reduce((sum, subject) => sum + subject.engagement_rate, 0) / subjectAnalytics.length 
      : 0;

    const topSubject = subjectAnalytics.length > 0 ? subjectAnalytics[0].subject : 'None';
    const mostEngagedSubject = subjectAnalytics.length > 0 ? subjectAnalytics[0].subject : 'None';

    console.log('[GET admin/analytics] Analytics data retrieved successfully');

    const response = NextResponse.json({
      subjectAnalytics,
      totalEngagement,
      averageEngagement,
      topSubject,
      mostEngagedSubject
    });

    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET admin/analytics] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}
