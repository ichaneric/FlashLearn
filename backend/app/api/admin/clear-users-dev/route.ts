import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Starting to clear all user data (DEV MODE)...');

    // Clear data in the correct order to avoid foreign key constraint issues
    // 1. Clear inbox messages first (they reference users)
    const inboxDeleted = await prisma.inbox.deleteMany({});
    console.log(`🗑️ Deleted ${inboxDeleted.count} inbox messages`);

    // 2. Clear cards (they reference sets)
    const cardsDeleted = await prisma.card.deleteMany({});
    console.log(`🗑️ Deleted ${cardsDeleted.count} cards`);

    // 3. Clear sets (they reference users)
    const setsDeleted = await prisma.set.deleteMany({});
    console.log(`🗑️ Deleted ${setsDeleted.count} sets`);

    // 4. Clear friend requests
    const friendRequestsDeleted = await prisma.friendRequest.deleteMany({});
    console.log(`🗑️ Deleted ${friendRequestsDeleted.count} friend requests`);

    // 5. Finally, clear all users
    const usersDeleted = await prisma.user.deleteMany({});
    console.log(`🗑️ Deleted ${usersDeleted.count} users`);

    // 6. Reset auto-increment counters (if using MySQL)
    try {
      await prisma.$executeRaw`ALTER TABLE user AUTO_INCREMENT = 1`;
      await prisma.$executeRaw`ALTER TABLE set AUTO_INCREMENT = 1`;
      await prisma.$executeRaw`ALTER TABLE card AUTO_INCREMENT = 1`;
      await prisma.$executeRaw`ALTER TABLE inbox AUTO_INCREMENT = 1`;
      await prisma.$executeRaw`ALTER TABLE friend_request AUTO_INCREMENT = 1`;
      console.log('🔄 Reset auto-increment counters');
    } catch (error) {
      console.log('⚠️ Could not reset auto-increment counters (this is normal for PostgreSQL)');
    }

    const totalDeleted = {
      users: usersDeleted.count,
      sets: setsDeleted.count,
      cards: cardsDeleted.count,
      inbox: inboxDeleted.count,
      friendRequests: friendRequestsDeleted.count
    };

    console.log('✅ All user data cleared successfully!');
    console.log('📊 Summary:', totalDeleted);

    return NextResponse.json({
      success: true,
      message: 'All user data cleared successfully (DEV MODE)',
      deleted: totalDeleted
    });

  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    return NextResponse.json({ 
      error: 'Failed to clear user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Also allow DELETE method for the same functionality
export async function DELETE(req: NextRequest) {
  return POST(req);
} 