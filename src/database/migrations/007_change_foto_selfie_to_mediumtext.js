const pool = require('../../config/database');

exports.up = async () => {
  await pool.query(`
    ALTER TABLE \`absensi_technical_meeting\` 
    MODIFY COLUMN \`foto_selfie\` MEDIUMTEXT DEFAULT NULL;
  `);
  console.log('✅ Migration: foto_selfie column changed to MEDIUMTEXT in absensi_technical_meeting');
};

exports.down = async () => {
  await pool.query(`
    ALTER TABLE \`absensi_technical_meeting\` 
    MODIFY COLUMN \`foto_selfie\` VARCHAR(255) DEFAULT NULL;
  `);
  console.log('✅ Rollback: foto_selfie column changed back to VARCHAR(255) in absensi_technical_meeting');
};
