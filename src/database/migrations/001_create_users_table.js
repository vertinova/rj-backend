const pool = require('../../config/database');

const up = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`nis\` varchar(20) NOT NULL UNIQUE,
      \`email\` varchar(255) DEFAULT NULL,
      \`password\` varchar(255) NOT NULL,
      \`nama_lengkap\` varchar(255) NOT NULL,
      \`kelas\` varchar(50) DEFAULT NULL,
      \`no_telepon\` varchar(20) DEFAULT NULL,
      \`alamat\` text DEFAULT NULL,
      \`foto_profil\` varchar(255) DEFAULT NULL,
      \`role\` enum('admin','taruna') NOT NULL DEFAULT 'taruna',
      \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_nis\` (\`nis\`),
      KEY \`idx_role\` (\`role\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(query);
  console.log('✅ Migration: users table created');
};

const down = async () => {
  await pool.query('DROP TABLE IF EXISTS `users`');
  console.log('✅ Rollback: users table dropped');
};

module.exports = { up, down };
