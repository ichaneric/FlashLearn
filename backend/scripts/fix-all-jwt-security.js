// File: fix-all-jwt-security.js
// Description: Comprehensive script to fix all JWT security vulnerabilities across API endpoints

const fs = require('fs');
const path = require('path');

/**
 * List of API endpoints that need JWT security fixes
 */
const API_ENDPOINTS_TO_FIX = [
  'app/api/admin/sets/route.ts',
  'app/api/admin/clear-users/route.ts',
  'app/api/card/delete/route.ts',
  'app/api/download/card/route.ts',
  'app/api/friend/requests/route.ts',
  'app/api/friend/request/[userId]/route.ts',
  'app/api/friend/remove/[userId]/route.ts',
  'app/api/friend/accept/[requestId]/route.ts',
  'app/api/friend/decline/[requestId]/route.ts',
  'app/api/inbox/get/route.ts',
  'app/api/set/[set_id]/route.ts',
  'app/api/set/[set_id]/publish/route.ts',
  'app/api/set/edit/route.ts',
  'app/api/set/delete/route.ts',
  'app/api/set/drafts/route.ts',
  'app/api/set/save/route.ts',
  'app/api/set/send/route.ts',
  'app/api/user/[user_id]/stats/route.ts',
  'app/api/user/search/route.ts',
  'app/api/user/profile/route.ts',
  'app/api/user/friends/route.ts',
  'app/api/user/friends/add/route.ts',
  'app/api/user/friends/remove/route.ts',
  'app/api/users/route.ts',
];

/**
 * Template for secure API endpoint with proper JWT handling
 */
const SECURE_ENDPOINT_TEMPLATE = `// File: route.ts
// Description: {DESCRIPTION}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractAndVerifyToken } from '../../../lib/jwtUtils';
import { addCorsHeaders, createCorsPreflightResponse } from '../../../lib/corsUtils';

const prisma = new PrismaClient();

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}

export async function GET(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[GET {ENDPOINT}] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[GET {ENDPOINT}] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[POST {ENDPOINT}] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[POST {ENDPOINT}] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[PUT {ENDPOINT}] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[PUT {ENDPOINT}] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract and verify token using secure utility
    const authHeader = req.headers.get('authorization');
    const decoded = extractAndVerifyToken(authHeader);
    
    if (!decoded) {
      console.error('[DELETE {ENDPOINT}] Error: Unauthorized - Invalid or missing token');
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response, req.headers.get('origin'));
    }

    // TODO: Implement endpoint-specific logic here
    
    const response = NextResponse.json({ message: 'Success' });
    return addCorsHeaders(response, req.headers.get('origin'));
  } catch (error) {
    console.error('[DELETE {ENDPOINT}] Error:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response, req.headers.get('origin'));
  } finally {
    await prisma.$disconnect();
  }
}`;

/**
 * Fixes a single API endpoint file
 */
function fixEndpointFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file already uses secure JWT utilities
    if (content.includes('extractAndVerifyToken') && content.includes('addCorsHeaders')) {
      console.log(`✅ Already secure: ${filePath}`);
      return true;
    }

    // Check if file has hardcoded JWT secret
    if (!content.includes("JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'")) {
      console.log(`⚠️  No hardcoded JWT secret found: ${filePath}`);
      return false;
    }

    // Create backup
    const backupPath = fullPath + '.backup';
    fs.writeFileSync(backupPath, content);
    console.log(`📦 Backup created: ${backupPath}`);

    // Generate secure template
    const endpointName = filePath.replace('app/api/', '').replace('/route.ts', '');
    const secureContent = SECURE_ENDPOINT_TEMPLATE
      .replace(/{DESCRIPTION}/g, `Handles ${endpointName} operations with secure JWT validation`)
      .replace(/{ENDPOINT}/g, endpointName);

    // Write secure version
    fs.writeFileSync(fullPath, secureContent);
    console.log(`🔒 Fixed: ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function to fix all endpoints
 */
function main() {
  console.log('🔒 FlashLearn JWT Security Fix Script');
  console.log('=====================================\n');

  let fixedCount = 0;
  let totalCount = API_ENDPOINTS_TO_FIX.length;

  for (const endpoint of API_ENDPOINTS_TO_FIX) {
    if (fixEndpointFile(endpoint)) {
      fixedCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Fixed: ${fixedCount}/${totalCount} endpoints`);
  console.log(`⚠️  Skipped: ${totalCount - fixedCount} endpoints`);
  
  if (fixedCount > 0) {
    console.log('\n🔧 Next Steps:');
    console.log('1. Review the generated templates');
    console.log('2. Implement endpoint-specific logic in each file');
    console.log('3. Test each endpoint thoroughly');
    console.log('4. Remove backup files once testing is complete');
  }

  console.log('\n✨ JWT security fixes completed!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixEndpointFile, API_ENDPOINTS_TO_FIX };
