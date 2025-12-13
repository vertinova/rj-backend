/**
 * Fresh Database Setup
 * 
 * This script will:
 * 1. Drop all existing tables
 * 2. Run all migrations
 * 3. Run all seeders
 * 
 * Usage: node src/database/fresh.js
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '../..');

console.log('');
console.log('═══════════════════════════════════════════');
console.log('      RAJAWALI DATABASE FRESH SETUP');
console.log('═══════════════════════════════════════════');
console.log('');
console.log('⚠️  WARNING: This will DROP all existing tables!');
console.log('');

async function main() {
  try {
    // Run migrations with --fresh flag
    console.log('📦 Step 1: Running fresh migrations...');
    execSync('node src/database/migrate.js --fresh', {
      cwd: rootDir,
      stdio: 'inherit'
    });

    // Run seeders
    console.log('📦 Step 2: Running seeders...');
    execSync('node src/database/seed.js', {
      cwd: rootDir,
      stdio: 'inherit'
    });

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('     ✅ DATABASE SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
