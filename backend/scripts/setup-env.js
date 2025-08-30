#!/usr/bin/env node

// File: setup-env.js
// Description: Secure environment setup script to help users configure their environment variables

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generates a secure random string
 * @param {number} length - The length of the string to generate
 * @returns {string} A secure random string
 */
function generateSecureString(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Creates a secure JWT secret
 * @returns {string} A secure JWT secret
 */
function generateJwtSecret() {
  return generateSecureString(64);
}

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Prompts user for input
 * @param {string} question - The question to ask
 * @param {string} defaultValue - Default value
 * @returns {Promise<string>} User input
 */
function prompt(question, defaultValue = '') {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${question}${defaultValue ? ` (${defaultValue})` : ''}: `, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

/**
 * Main setup function
 */
async function setupEnvironment() {
  console.log('🔒 FlashLearn Security Environment Setup');
  console.log('=====================================\n');

  try {
    // Check if .env file already exists
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const overwrite = await prompt('Environment file already exists. Overwrite? (y/N)', 'N');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        return;
      }
    }

    console.log('📝 Setting up secure environment variables...\n');

    // Generate secure JWT secret
    const jwtSecret = generateJwtSecret();
    console.log('✅ Generated secure JWT secret');

    // Get database configuration
    const databaseUrl = await prompt('Database URL (file:./prisma/dev.db)', 'file:./prisma/dev.db');
    console.log('✅ Database URL configured');

    // Get DeepSeek API key (optional)
    const deepseekApiKey = await prompt('DeepSeek API Key (optional - press Enter to skip)', '');
    console.log('✅ DeepSeek API key configured');

    // Get port
    const port = await prompt('Server port', '3000');
    console.log('✅ Server port configured');

    // Get environment
    const nodeEnv = await prompt('Environment (development/production)', 'development');
    console.log('✅ Environment configured');

    // Create .env content
    const envContent = `# FlashLearn Environment Configuration
# Generated on ${new Date().toISOString()}

# Environment
NODE_ENV=${nodeEnv}

# Security
JWT_SECRET=${jwtSecret}

# Database
DATABASE_URL="${databaseUrl}"

# AI Service (Optional)
${deepseekApiKey ? `DEEPSEEK_API_KEY=${deepseekApiKey}` : '# DEEPSEEK_API_KEY=your-deepseek-api-key-here'}

# Server
PORT=${port}

# Security Headers
SECURE_HEADERS=true

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
`;

    // Write .env file
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Environment file created successfully!');
    console.log(`📁 Location: ${envPath}`);

    // Create uploads directory
    const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
      fs.writeFileSync(path.join(uploadsPath, '.gitkeep'), '');
      console.log('✅ Uploads directory created');
    }

    // Security recommendations
    console.log('\n🔒 Security Recommendations:');
    console.log('1. Keep your .env file secure and never commit it to version control');
    console.log('2. Use a strong, unique JWT_SECRET in production');
    console.log('3. Configure proper CORS origins for production');
    console.log('4. Use HTTPS in production');
    console.log('5. Regularly update dependencies');
    console.log('6. Monitor logs for suspicious activity');

    console.log('\n🚀 Setup complete! You can now start your application.');
    console.log('Run: npm run dev');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupEnvironment();
}

module.exports = { setupEnvironment, generateJwtSecret };
