const pool = require('../../config/database');

const up = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS \`users_lakaraja\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`username\` varchar(100) NOT NULL UNIQUE,
      \`email\` varchar(255) DEFAULT NULL,
      \`password\` varchar(255) NOT NULL,
      \`nama_lengkap\` varchar(255) DEFAULT NULL,
      \`no_telepon\` varchar(20) NOT NULL,
      \`role\` enum('peserta','panitia') NOT NULL DEFAULT 'peserta',
      \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_username\` (\`username\`),
      KEY \`idx_role\` (\`role\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(query);
  console.log('✅ Migration: users_lakaraja table created');
};

const down = async () => {
  await pool.query('DROP TABLE IF EXISTS `users_lakaraja`');
  console.log('✅ Rollback: users_lakaraja table dropped');
};

module.exports = { up, down };
