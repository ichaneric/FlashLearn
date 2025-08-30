// File: route.ts
// Description: Simple test route for sets

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Testing sets endpoint...');
    
    const sets = await prisma.set.findMany({
      where: { posted: true },
      select: {
        set_id: true,
        set_name: true,
        set_subject: true,
        user: {
          select: {
            full_name: true
          }
        }
      }
    });

    console.log(`✅ Found ${sets.length} sets`);
    
    return NextResponse.json({ 
      success: true, 
      count: sets.length,
      sets: sets 
    });
    
  } catch (error: any) {
    console.error('❌ Test sets error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
