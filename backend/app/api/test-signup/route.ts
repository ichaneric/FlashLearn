// File: route.ts
// Description: Minimal test signup route

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Test signup request received');
    
    // Parse JSON body
    const body = await req.json();
    console.log('📝 Request body:', body);
    
    return NextResponse.json({ 
      success: true,
      message: 'Test signup received',
      data: body
    });
    
  } catch (error: any) {
    console.error('❌ Test signup error:', error);
    return NextResponse.json({ 
      error: 'Test signup failed',
      details: error.message
    }, { status: 500 });
  }
}
