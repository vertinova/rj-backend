const pool = require('../../config/database');

const up = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS \`absensi\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`tanggal\` date NOT NULL,
      \`waktu_masuk\` time DEFAULT NULL,
      \`waktu_pulang\` time DEFAULT NULL,
      \`status\` enum('hadir','izin','sakit','alpha','terlambat') NOT NULL DEFAULT 'hadir',
      \`tipe_absensi\` enum('pagi','siang','sore','malam','latihan','upacara','event') NOT NULL DEFAULT 'pagi',
      \`foto_masuk\` varchar(255) DEFAULT NULL,
      \`foto_pulang\` varchar(255) DEFAULT NULL,
      \`lokasi_masuk\` varchar(255) DEFAULT NULL,
      \`lokasi_pulang\` varchar(255) DEFAULT NULL,
      \`keterangan\` text DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_user_id\` (\`user_id\`),
      KEY \`idx_tanggal\` (\`tanggal\`),
      KEY \`idx_status\` (\`status\`),
      UNIQUE KEY \`unique_absensi\` (\`user_id\`, \`tanggal\`, \`tipe_absensi\`),
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(query);
  console.log('✅ Migration: absensi table created');
};

const down = async () => {
  await pool.query('DROP TABLE IF EXISTS `absensi`');
  console.log('✅ Rollback: absensi table dropped');
};

module.exports = { up, down };
