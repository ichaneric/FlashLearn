// File: route.ts
// Description: Simple test login route for debugging

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('🔍 Test login attempt:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email: email } 
    });
    
    console.log(`   User found: ${user ? 'Yes' : 'No'}`);
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log(`   User: ${user.full_name}`);
    console.log(`   Stored password hash: ${user.password.substring(0, 20)}...`);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log(`   Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: 'Invalid password' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name
      },
      message: 'Login successful'
    });
    
  } catch (error: any) {
    console.error('❌ Test login error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
