// File: route.ts
// Description: Simple signup route without database operations

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Simple signup request received');
    
    // Parse JSON body
    const body = await req.json();
    const { username, full_name, educational_level, email, password } = body;
    
    console.log('📝 Signup data:', { username, full_name, email, educational_level, password: password ? '***' : 'MISSING' });
    
    // Basic validation
    if (!username || !full_name || !email || !password || !educational_level) {
      return NextResponse.json({ 
        error: 'All fields are required'
      }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }
    
    console.log('✅ Validation passed, user would be created');
    
    return NextResponse.json({ 
      success: true,
      message: 'User validation successful (database creation disabled for testing)', 
      user: {
        id: 'test-id-123',
        username: username,
        email: email,
        full_name: full_name,
        educational_level: educational_level,
        profile_image: '1.jpg'
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Simple signup error:', error);
    return NextResponse.json({ 
      error: 'Signup failed',
      details: error.message
    }, { status: 500 });
  }
}
