const pool = require('../../config/database');

const up = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS \`absensi_technical_meeting\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`pendaftaran_id\` int NOT NULL,
      \`waktu_absen\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`panitia_id\` int NOT NULL,
      \`catatan\` text DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_pendaftaran_id\` (\`pendaftaran_id\`),
      KEY \`idx_panitia_id\` (\`panitia_id\`),
      KEY \`idx_waktu_absen\` (\`waktu_absen\`),
      UNIQUE KEY \`unique_pendaftaran_absen\` (\`pendaftaran_id\`),
      FOREIGN KEY (\`pendaftaran_id\`) REFERENCES \`pendaftaran_lakaraja\` (\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`panitia_id\`) REFERENCES \`users_lakaraja\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(query);
  console.log('✅ Migration: absensi_technical_meeting table created');
};

const down = async () => {
  await pool.query('DROP TABLE IF EXISTS `absensi_technical_meeting`');
  console.log('✅ Rollback: absensi_technical_meeting table dropped');
};

module.exports = { up, down };
