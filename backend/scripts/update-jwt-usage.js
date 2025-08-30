#!/usr/bin/env node

// File: update-jwt-usage.js
// Description: Script to update all API routes to use secure JWT utilities

const fs = require('fs');
const path = require('path');

/**
 * Updates a file to use secure JWT utilities
 * @param {string} filePath - Path to the file to update
 */
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Check if file already uses secure JWT utilities
    if (content.includes('extractAndVerifyToken')) {
      console.log(`✅ ${filePath} - Already using secure JWT utilities`);
      return;
    }

    // Replace hardcoded JWT imports
    if (content.includes("const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';")) {
      content = content.replace(
        "import jwt from 'jsonwebtoken';\n\nconst JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';",
        "import { extractAndVerifyToken } from '../../../lib/jwtUtils';\nimport { addCorsHeaders, createCorsPreflightResponse } from '../../../lib/corsUtils';"
      );
      updated = true;
    }

    // Add OPTIONS handler if not present
    if (!content.includes('export async function OPTIONS')) {
      const optionsHandler = `
export async function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req.headers.get('origin'));
}`;
      
      // Find the first export function and add OPTIONS before it
      const exportMatch = content.match(/export async function (GET|POST|PUT|DELETE)/);
      if (exportMatch) {
        const insertIndex = content.indexOf(exportMatch[0]);
        content = content.slice(0, insertIndex) + optionsHandler + '\n\n' + content.slice(insertIndex);
        updated = true;
      }
    }

    // Replace token verification logic
    if (content.includes('const token = req.headers.get(\'authorization\')?.split(\' \')[1];')) {
      content = content.replace(
        'const token = req.headers.get(\'authorization\')?.split(\' \')[1];\n  const decoded = token ? verifyToken(token) : null;',
        'const authHeader = req.headers.get(\'authorization\');\n  const decoded = extractAndVerifyToken(authHeader);'
      );
      updated = true;
    }

    // Replace verifyToken function calls
    if (content.includes('verifyToken(')) {
      content = content.replace(/verifyToken\(/g, 'extractAndVerifyToken(');
      updated = true;
    }

    // Add CORS headers to responses
    if (content.includes('return NextResponse.json(') && !content.includes('addCorsHeaders')) {
      content = content.replace(
        /return NextResponse\.json\(([^)]+)\);/g,
        'const response = NextResponse.json($1);\n    return addCorsHeaders(response, req.headers.get(\'origin\'));'
      );
      updated = true;
    }

    // Remove old verifyToken function definition
    if (content.includes('const verifyToken = (token: string) => {')) {
      content = content.replace(
        /const verifyToken = \(token: string\) => \{\s+try \{\s+return jwt\.verify\(token, JWT_SECRET\);\s+\} catch \(error\) \{\s+return null;\s+\}\s+\};/g,
        ''
      );
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath} - Updated to use secure JWT utilities`);
    } else {
      console.log(`⚠️  ${filePath} - No changes needed or manual review required`);
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

/**
 * Recursively finds and updates API route files
 * @param {string} dir - Directory to search
 */
function updateApiRoutes(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      updateApiRoutes(filePath);
    } else if (file === 'route.ts' && dir.includes('/api/')) {
      updateFile(filePath);
    }
  });
}

/**
 * Main function
 */
function main() {
  console.log('🔧 Updating API routes to use secure JWT utilities...\n');
  
  const apiDir = path.join(__dirname, '..', 'app', 'api');
  
  if (fs.existsSync(apiDir)) {
    updateApiRoutes(apiDir);
    console.log('\n✅ JWT security update complete!');
  } else {
    console.log('❌ API directory not found');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateFile, updateApiRoutes };
