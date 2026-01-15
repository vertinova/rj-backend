const pool = require('../../config/database');

exports.up = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`kuota_lakaraja\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`kategori\` enum('SD','SMP','SMA') NOT NULL,
      \`kuota\` int(11) NOT NULL DEFAULT 0,
      \`terisi\` int(11) NOT NULL DEFAULT 0,
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`updated_by\` int(11) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`kategori\` (\`kategori\`),
      KEY \`updated_by\` (\`updated_by\`),
      CONSTRAINT \`kuota_lakaraja_ibfk_1\` FOREIGN KEY (\`updated_by\`) REFERENCES \`users_lakaraja\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Insert default quotas
  await pool.query(`
    INSERT INTO \`kuota_lakaraja\` (\`kategori\`, \`kuota\`, \`terisi\`) VALUES
    ('SD', 0, 0),
    ('SMP', 0, 0),
    ('SMA', 0, 0)
    ON DUPLICATE KEY UPDATE \`kategori\` = VALUES(\`kategori\`);
  `);

  console.log('✅ Migration: kuota_lakaraja table created with default values');
};

exports.down = async () => {
  await pool.query('DROP TABLE IF EXISTS `kuota_lakaraja`');
  console.log('✅ Rollback: kuota_lakaraja table dropped');
};
