const pool = require('../../config/database');

const up = async () => {
  const query = `
    ALTER TABLE \`absensi_technical_meeting\`
    ADD COLUMN \`foto_selfie\` varchar(255) DEFAULT NULL AFTER \`panitia_id\`;
  `;

  await pool.query(query);
  console.log('✅ Migration: foto_selfie column added to absensi_technical_meeting');
};

const down = async () => {
  await pool.query('ALTER TABLE `absensi_technical_meeting` DROP COLUMN `foto_selfie`');
  console.log('✅ Rollback: foto_selfie column dropped from absensi_technical_meeting');
};

module.exports = { up, down };
