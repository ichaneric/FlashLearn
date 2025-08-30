import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();
    if (!category) {
      return NextResponse.json({ error: 'Missing category' }, { status: 400 });
    }

    const sets = await prisma.set.findMany({
      where: { category, posted: true },
      include: { cards: true, user: { select: { full_name: true } } },
    });
    return NextResponse.json(sets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch sets' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}