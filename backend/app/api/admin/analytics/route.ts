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

    // Get all posted sets
    const allSets = await prisma.set.findMany({
      where: { posted: true },
      include: {
        savedBy: true,
        cards: true
      }
    });

    // Get total engagement
    const totalEngagement = await prisma.setSave.count();

    // Group sets by subject
    const subjectGroups: { [key: string]: any[] } = {};
    allSets.forEach(set => {
      const subject = set.set_subject || 'General';
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = [];
      }
      subjectGroups[subject].push(set);
    });

    // Calculate subject analytics
    const subjectAnalytics = Object.entries(subjectGroups).map(([subject, sets]) => {
      const setsCount = sets.length;
      const totalLearners = sets.reduce((sum, set) => sum + set.savedBy.length, 0);
      const totalCards = sets.reduce((sum, set) => sum + set.cards.length, 0);
      const engagementRate = totalEngagement > 0 ? (totalLearners / totalEngagement) * 100 : 0;

      return {
        subject,
        sets_count: setsCount,
        total_cards: totalCards,
        total_learners: totalLearners,
        engagement_rate: Math.round(engagementRate * 100) / 100
      };
    });

    // Sort by engagement rate
    subjectAnalytics.sort((a, b) => b.engagement_rate - a.engagement_rate);

    // Calculate overall statistics
    const averageEngagement = subjectAnalytics.length > 0 
      ? Math.round((subjectAnalytics.reduce((sum, subject) => sum + subject.engagement_rate, 0) / subjectAnalytics.length) * 100) / 100
      : 0;

    const topSubject = subjectAnalytics.length > 0 ? subjectAnalytics[0].subject : 'None';
    const mostEngagedSubject = subjectAnalytics.length > 0 ? subjectAnalytics[0].subject : 'None';

    console.log('[GET admin/analytics] Analytics data retrieved successfully');

    const response = NextResponse.json({
      subjectAnalytics,
      totalEngagement,
      averageEngagement,
      topSubject,
      mostEngagedSubject,
      totalSets: allSets.length,
      totalCards: allSets.reduce((sum, set) => sum + set.cards.length, 0)
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
