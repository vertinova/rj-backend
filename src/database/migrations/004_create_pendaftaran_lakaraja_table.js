const pool = require('../../config/database');

const up = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS \`pendaftaran_lakaraja\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`nama_sekolah\` varchar(255) NOT NULL,
      \`nama_satuan\` varchar(255) NOT NULL,
      \`kategori\` enum('SD','SMP','SMA') NOT NULL DEFAULT 'SMA',
      \`logo_satuan\` varchar(255) DEFAULT NULL,
      \`bukti_payment\` varchar(255) DEFAULT NULL,
      \`status_pendaftaran\` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      \`catatan_panitia\` text DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_user_id\` (\`user_id\`),
      KEY \`idx_status\` (\`status_pendaftaran\`),
      KEY \`idx_kategori\` (\`kategori\`),
      UNIQUE KEY \`unique_user_registration\` (\`user_id\`),
      FOREIGN KEY (\`user_id\`) REFERENCES \`users_lakaraja\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(query);
  console.log('✅ Migration: pendaftaran_lakaraja table created');
};

const down = async () => {
  await pool.query('DROP TABLE IF EXISTS `pendaftaran_lakaraja`');
  console.log('✅ Rollback: pendaftaran_lakaraja table dropped');
};

module.exports = { up, down };
