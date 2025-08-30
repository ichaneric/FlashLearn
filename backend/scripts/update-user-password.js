// File: update-user-password.js
// Description: Script to update a user's password

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

/**
 * Updates a user's password
 */
async function updateUserPassword(email, newPassword) {
  const prisma = new PrismaClient();
  
  try {
    console.log(`🔐 Updating password for user: ${email}\n`);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
      select: {
        user_id: true,
        full_name: true,
        email: true
      }
    });
    
    if (!existingUser) {
      console.log('❌ User not found in database');
      return;
    }
    
    console.log(`✅ Found user: ${existingUser.full_name}`);
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password
    await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   User: ${existingUser.full_name}`);
    
  } catch (error) {
    console.error('❌ Failed to update password:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line arguments
const email = process.argv[2] || 'eric@gmail.com';
const password = process.argv[3] || '123123123';

// Run if called directly
if (require.main === module) {
  updateUserPassword(email, password);
}

module.exports = { updateUserPassword };
