// File: check-user.js
// Description: Script to check if a specific user exists in the database

const { PrismaClient } = require('@prisma/client');

/**
 * Check if a specific user exists
 */
async function checkUser(email) {
  const prisma = new PrismaClient();
  
  try {
    console.log(`🔍 Checking for user: ${email}\n`);
    
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        isAdmin: true,
        educational_level: true,
        profile: true
        // Note: We don't select password for security
      }
    });
    
    if (user) {
      console.log('✅ User found!');
      console.log(`   User ID: ${user.user_id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Full Name: ${user.full_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Educational Level: ${user.educational_level}`);
      console.log(`   Profile Image: ${user.profile}`);
    } else {
      console.log('❌ User not found in database');
      console.log('\n📋 Available users:');
      
      const allUsers = await prisma.user.findMany({
        select: {
          username: true,
          full_name: true,
          email: true
        }
      });
      
      allUsers.forEach(u => {
        console.log(`   - ${u.full_name} (${u.username}) - ${u.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'eric@gmail.com';

// Run if called directly
if (require.main === module) {
  checkUser(email);
}

module.exports = { checkUser };
