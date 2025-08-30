// File: route.ts
// Description: Working signup route using direct PrismaClient

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Working signup request received');
    
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
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        user_id: uuidv4(),
        username: username.trim(),
        full_name: full_name.trim(),
        educational_level: educational_level,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        profile: '1.jpg',
        isAdmin: false,
      },
    });
    
    console.log('✅ User created:', user.user_id);
    
    return NextResponse.json({ 
      success: true,
      message: 'User created successfully', 
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        educational_level: user.educational_level,
        profile_image: user.profile
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Working signup error:', error);
    
    if (error?.code === 'P2002') {
      return NextResponse.json({ 
        error: 'User with this email or username already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Registration failed',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
