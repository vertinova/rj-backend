/**
 * Database Seeder Runner
 * 
 * Usage:
 *   node src/database/seed.js        - Run all seeders
 *   node src/database/seed.js --only=001  - Run specific seeder
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const seedersPath = path.join(__dirname, 'seeders');

// Get command line arguments
const args = process.argv.slice(2);
const onlyArg = args.find(arg => arg.startsWith('--only='));
const onlySeeder = onlyArg ? onlyArg.split('=')[1] : null;

async function getSeederFiles() {
  const files = fs.readdirSync(seedersPath)
    .filter(file => file.endsWith('.js'))
    .sort();
  return files;
}

async function runSeeders() {
  console.log('\n🌱 Running Seeders...\n');
  
  const seederFiles = await getSeederFiles();
  let seedersRun = 0;
  
  for (const file of seederFiles) {
    const seederName = file.replace('.js', '');
    
    // If --only flag is set, skip non-matching seeders
    if (onlySeeder && !file.startsWith(onlySeeder)) {
      continue;
    }
    
    try {
      console.log(`\n📦 Running: ${seederName}`);
      console.log('─'.repeat(40));
      
      const seeder = require(path.join(seedersPath, file));
      await seeder.run();
      seedersRun++;
    } catch (error) {
      console.error(`❌ Error running seeder ${seederName}:`, error.message);
      // Continue with other seeders
    }
  }
  
  console.log('\n' + '═'.repeat(40));
  console.log(`✅ ${seedersRun} seeder(s) executed.`);
  console.log('═'.repeat(40) + '\n');
}

async function main() {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('        RAJAWALI DATABASE SEEDER');
    console.log('═══════════════════════════════════════════');
    
    await runSeeders();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error.message);
    process.exit(1);
  }
}

main();
