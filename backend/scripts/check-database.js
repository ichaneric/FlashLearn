// File: check-database.js
// Description: Script to check database content and connection

const { PrismaClient } = require('@prisma/client');

/**
 * Main function to check database content
 */
async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking FlashLearn Database...\n');
    
    // Check connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');
    
    // Check users
    console.log('2. Checking users...');
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        isAdmin: true
      }
    });
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.full_name} (${user.username}) - ${user.isAdmin ? 'Admin' : 'User'}`);
    });
    console.log('');
    
    // Check sets
    console.log('3. Checking sets...');
    const sets = await prisma.set.findMany({
      select: {
        set_id: true,
        set_name: true,
        set_subject: true,
        posted: true,
        status: true,
        user: {
          select: {
            full_name: true,
            username: true
          }
        }
      }
    });
    console.log(`📊 Found ${sets.length} sets:`);
    sets.forEach(set => {
      console.log(`   - "${set.set_name}" by ${set.user.full_name} (${set.posted ? 'Posted' : 'Draft'})`);
    });
    console.log('');
    
    // Check cards
    console.log('4. Checking cards...');
    const cards = await prisma.card.findMany({
      select: {
        card_id: true,
        card_question: true,
        set: {
          select: {
            set_name: true
          }
        }
      }
    });
    console.log(`📊 Found ${cards.length} cards:`);
    cards.forEach(card => {
      console.log(`   - "${card.card_question.substring(0, 50)}..." in "${card.set.set_name}"`);
    });
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };
