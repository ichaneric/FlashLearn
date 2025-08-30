#!/usr/bin/env node

// File: security-check.js
// Description: Security check script to validate the application's security configuration

const fs = require('fs');
const path = require('path');

/**
 * Security check results
 */
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: []
};

/**
 * Adds a check result
 * @param {string} name - Check name
 * @param {boolean} passed - Whether check passed
 * @param {string} message - Result message
 * @param {string} severity - 'error', 'warning', or 'info'
 */
function addCheck(name, passed, message, severity = 'error') {
  const check = { name, passed, message, severity };
  results.checks.push(check);
  
  if (passed) {
    results.passed++;
  } else if (severity === 'warning') {
    results.warnings++;
  } else {
    results.failed++;
  }
}

/**
 * Checks if a file exists
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

/**
 * Reads and validates .env file
 */
function checkEnvironmentFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fileExists('.env')) {
    addCheck('Environment File', false, '.env file not found. Run npm run setup to create it.');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for JWT_SECRET
  if (!envContent.includes('JWT_SECRET=')) {
    addCheck('JWT Secret', false, 'JWT_SECRET not found in .env file');
  } else if (envContent.includes('JWT_SECRET=your-secret-key')) {
    addCheck('JWT Secret', false, 'JWT_SECRET is set to default value. Use a strong, unique secret.');
  } else {
    addCheck('JWT Secret', true, 'JWT_SECRET is properly configured');
  }

  // Check for DATABASE_URL
  if (!envContent.includes('DATABASE_URL=')) {
    addCheck('Database URL', false, 'DATABASE_URL not found in .env file');
  } else {
    addCheck('Database URL', true, 'DATABASE_URL is configured');
  }

  // Check for NODE_ENV
  if (!envContent.includes('NODE_ENV=')) {
    addCheck('Node Environment', false, 'NODE_ENV not found in .env file');
  } else {
    addCheck('Node Environment', true, 'NODE_ENV is configured');
  }
}

/**
 * Checks .gitignore configuration
 */
function checkGitignore() {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  
  if (!fileExists('.gitignore')) {
    addCheck('Gitignore', false, '.gitignore file not found');
    return;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  // Check for .env files
  if (!gitignoreContent.includes('.env')) {
    addCheck('Gitignore .env', false, '.env files not ignored in .gitignore');
  } else {
    addCheck('Gitignore .env', true, '.env files are properly ignored');
  }

  // Check for database files
  if (!gitignoreContent.includes('*.db')) {
    addCheck('Gitignore Database', false, 'Database files not ignored in .gitignore');
  } else {
    addCheck('Gitignore Database', true, 'Database files are properly ignored');
  }

  // Check for uploads directory
  if (!gitignoreContent.includes('public/uploads/')) {
    addCheck('Gitignore Uploads', false, 'Uploads directory not ignored in .gitignore');
  } else {
    addCheck('Gitignore Uploads', true, 'Uploads directory is properly ignored');
  }
}

/**
 * Checks for sensitive files in repository
 */
function checkSensitiveFiles() {
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'prisma/dev.db',
    'prisma/prod.db'
  ];

  sensitiveFiles.forEach(file => {
    if (fileExists(file)) {
      addCheck(`Sensitive File: ${file}`, false, `Sensitive file ${file} found in repository`);
    } else {
      addCheck(`Sensitive File: ${file}`, true, `Sensitive file ${file} not found in repository`);
    }
  });
}

/**
 * Checks uploads directory security
 */
function checkUploadsDirectory() {
  const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
  
  if (!fs.existsSync(uploadsPath)) {
    addCheck('Uploads Directory', true, 'Uploads directory does not exist (will be created when needed)');
    return;
  }

  // Check if uploads directory has .gitkeep
  const gitkeepPath = path.join(uploadsPath, '.gitkeep');
  if (fs.existsSync(gitkeepPath)) {
    addCheck('Uploads .gitkeep', true, 'Uploads directory has .gitkeep file');
  } else {
    addCheck('Uploads .gitkeep', false, 'Uploads directory missing .gitkeep file');
  }
}

/**
 * Checks package.json for security-related dependencies
 */
function checkDependencies() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fileExists('package.json')) {
    addCheck('Package.json', false, 'package.json not found');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Check for bcrypt (password hashing)
  if (dependencies.bcrypt) {
    addCheck('Password Hashing', true, 'bcrypt is available for password hashing');
  } else {
    addCheck('Password Hashing', false, 'bcrypt not found for password hashing');
  }

  // Check for jsonwebtoken
  if (dependencies.jsonwebtoken) {
    addCheck('JWT Library', true, 'jsonwebtoken is available for JWT handling');
  } else {
    addCheck('JWT Library', false, 'jsonwebtoken not found for JWT handling');
  }

  // Check for uuid
  if (dependencies.uuid) {
    addCheck('UUID Library', true, 'uuid is available for secure ID generation');
  } else {
    addCheck('UUID Library', false, 'uuid not found for secure ID generation');
  }
}

/**
 * Main security check function
 */
function runSecurityCheck() {
  console.log('🔒 FlashLearn Security Check');
  console.log('===========================\n');

  // Run all checks
  checkEnvironmentFile();
  checkGitignore();
  checkSensitiveFiles();
  checkUploadsDirectory();
  checkDependencies();

  // Display results
  console.log('📋 Security Check Results:\n');

  results.checks.forEach(check => {
    const icon = check.passed ? '✅' : check.severity === 'warning' ? '⚠️' : '❌';
    const status = check.passed ? 'PASS' : check.severity === 'warning' ? 'WARN' : 'FAIL';
    console.log(`${icon} [${status}] ${check.name}: ${check.message}`);
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.failed > 0) {
    console.log('\n🚨 Security issues found! Please fix them before deploying.');
    console.log('💡 Run "npm run setup" to configure your environment securely.');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('\n⚠️  Security warnings found. Consider addressing them for better security.');
    process.exit(0);
  } else {
    console.log('\n🎉 All security checks passed! Your application is properly configured.');
    process.exit(0);
  }
}

// Run security check if this script is executed directly
if (require.main === module) {
  runSecurityCheck();
}

module.exports = { runSecurityCheck, addCheck };
