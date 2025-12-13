const pool = require('../../config/database');

const up = async () => {
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
  console.log('✅ Migration: migrations table created');
};

const down = async () => {
  await pool.query('DROP TABLE IF EXISTS `migrations`');
  console.log('✅ Rollback: migrations table dropped');
};

module.exports = { up, down };
