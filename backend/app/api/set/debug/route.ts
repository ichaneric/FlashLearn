import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/set/debug
// Returns all sets and their cards (for debugging only)
export async function GET(req: NextRequest) {
  try {
    const sets = await prisma.set.findMany({
      include: {
        cards: true,
        user: { select: { full_name: true, user_id: true } },
      },
    });
    console.log('[DEBUG /api/set/debug] Returning all sets and cards:', JSON.stringify(sets, null, 2));
    return NextResponse.json(sets);
  } catch (error) {
    console.error('[DEBUG /api/set/debug] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 