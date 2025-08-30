#!/usr/bin/env node

// File: setup-postgresql.js
// Description: Script to help set up PostgreSQL connection

const fs = require('fs');
const path = require('path');

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
async function setupPostgreSQL() {
  console.log('🐘 FlashLearn PostgreSQL Database Setup');
  console.log('=====================================\n');

  try {
    // Get PostgreSQL credentials
    const username = await prompt('PostgreSQL Username', 'postgres');
    const password = await prompt('PostgreSQL Password', '');
    const database = await prompt('Database Name', 'studybuddy');
    const host = await prompt('Host', 'localhost');
    const port = await prompt('Port', '5432');

    // Create DATABASE_URL
    const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}?schema=public`;

    // Read current .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*$/m, `DATABASE_URL="${databaseUrl}"`);
    } else {
      envContent += `\nDATABASE_URL="${databaseUrl}"`;
    }

    // Write updated .env file
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ PostgreSQL configuration updated!');
    console.log(`📁 Database URL: ${databaseUrl.replace(password, '***')}`);
    console.log('\n🔧 Next steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: npx prisma db push (to sync schema)');
    console.log('3. Run: npm run dev (to start the server)');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupPostgreSQL();
}

module.exports = { setupPostgreSQL };
