/**
 * Database Migration Runner
 * 
 * Usage:
 *   node src/database/migrate.js          - Run all pending migrations
 *   node src/database/migrate.js --fresh  - Drop all tables and run all migrations
 *   node src/database/migrate.js --rollback - Rollback last migration
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const migrationsPath = path.join(__dirname, 'migrations');

// Get command line arguments
const args = process.argv.slice(2);
const isFresh = args.includes('--fresh');
const isRollback = args.includes('--rollback');

async function ensureMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS \`migrations\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`executed_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_migration\` (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(query);
}

async function getExecutedMigrations() {
  const [rows] = await pool.query('SELECT name FROM migrations ORDER BY id ASC');
  return rows.map(row => row.name);
}

async function markMigrationAsExecuted(name) {
  await pool.query('INSERT INTO migrations (name) VALUES (?)', [name]);
}

async function removeMigrationRecord(name) {
  await pool.query('DELETE FROM migrations WHERE name = ?', [name]);
}

async function dropAllTables() {
  console.log('\n🗑️  Dropping all tables...\n');
  
  // Disable foreign key checks
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  
  // Get all tables
  const [tables] = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE()
  `);
  
  // Drop each table
  for (const table of tables) {
    const tableName = table.TABLE_NAME || table.table_name;
    await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    console.log(`   Dropped: ${tableName}`);
  }
  
  // Enable foreign key checks
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  
  console.log('\n✅ All tables dropped\n');
}

async function getMigrationFiles() {
  const files = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.js'))
    .sort();
  return files;
}

async function runMigrations() {
  console.log('\n🚀 Running Migrations...\n');
  
  await ensureMigrationsTable();
  
  const executedMigrations = await getExecutedMigrations();
  const migrationFiles = await getMigrationFiles();
  
  let migrationsRun = 0;
  
  for (const file of migrationFiles) {
    // Skip migrations table creation file if it exists
    if (file === '000_create_migrations_table.js') continue;
    
    const migrationName = file.replace('.js', '');
    
    if (executedMigrations.includes(migrationName)) {
      console.log(`⏭️  Skipping: ${migrationName} (already executed)`);
      continue;
    }
    
    try {
      const migration = require(path.join(migrationsPath, file));
      await migration.up();
      await markMigrationAsExecuted(migrationName);
      migrationsRun++;
    } catch (error) {
      console.error(`❌ Error running migration ${migrationName}:`, error.message);
      process.exit(1);
    }
  }
  
  if (migrationsRun === 0) {
    console.log('\n✅ Nothing to migrate. Database is up to date.\n');
  } else {
    console.log(`\n✅ ${migrationsRun} migration(s) executed successfully.\n`);
  }
}

async function rollbackLastMigration() {
  console.log('\n⏪ Rolling back last migration...\n');
  
  const executedMigrations = await getExecutedMigrations();
  
  if (executedMigrations.length === 0) {
    console.log('Nothing to rollback.\n');
    return;
  }
  
  const lastMigration = executedMigrations[executedMigrations.length - 1];
  const migrationFile = `${lastMigration}.js`;
  
  try {
    const migration = require(path.join(migrationsPath, migrationFile));
    await migration.down();
    await removeMigrationRecord(lastMigration);
    console.log(`\n✅ Rolled back: ${lastMigration}\n`);
  } catch (error) {
    console.error(`❌ Error rolling back ${lastMigration}:`, error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('       RAJAWALI DATABASE MIGRATION');
    console.log('═══════════════════════════════════════════');
    
    if (isFresh) {
      await dropAllTables();
    }
    
    if (isRollback) {
      await rollbackLastMigration();
    } else {
      await runMigrations();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
