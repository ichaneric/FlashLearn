// File: create-test-user.js
// Description: Script to create a test user with known credentials

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

/**
 * Creates a test user with known credentials
 */
async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('👤 Creating FlashLearn Test User...\n');
    
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@flashlearn.com' }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log(`   Email: test@flashlearn.com`);
      console.log(`   Password: test123456`);
      console.log(`   Name: ${existingUser.full_name}`);
      return;
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('test123456', saltRounds);
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        full_name: 'Test User',
        email: 'test@flashlearn.com',
        password: hashedPassword,
        educational_level: 'college',
        profile: '1.jpg',
        isAdmin: false
      }
    });
    
    console.log('✅ Test user created successfully!');
    console.log(`   Email: test@flashlearn.com`);
    console.log(`   Password: test123456`);
    console.log(`   Name: ${testUser.full_name}`);
    console.log(`   User ID: ${testUser.user_id}`);
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createTestUser();
}

module.exports = { createTestUser };
