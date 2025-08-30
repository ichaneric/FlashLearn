// File: test/route.ts
// Description: Simple test endpoint to verify backend functionality

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Backend is running successfully!',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({ 
      message: 'Test POST endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid JSON in request body' 
    }, { status: 400 });
  }
}
