// File: backend/scripts/create-admin-user.js
// Description: Script to create an admin user for testing admin features

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.username);
      return existingAdmin;
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        user_id: uuidv4(),
        username: 'admin',
        email: 'admin@flashlearn.com',
        password: await bcrypt.hash('admin123', 10),
        full_name: 'Flash Learn Admin',
        educational_level: 'college',
        profile: '1.jpg',
        isAdmin: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@flashlearn.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Username: admin');
    console.log('🆔 User ID:', adminUser.user_id);

    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 Admin user setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin user setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
