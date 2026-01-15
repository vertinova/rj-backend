const pool = require('../../config/database');

const up = async () => {
  // Add status_kuota column to differentiate between approved and waiting_list
  const query1 = `
    ALTER TABLE \`pendaftaran_lakaraja\` 
    ADD COLUMN \`status_kuota\` enum('approved','waiting_list') NOT NULL DEFAULT 'approved' 
    AFTER \`status_pendaftaran\`
  `;
  
  // Add waitlist_position for queue management
  const query2 = `
    ALTER TABLE \`pendaftaran_lakaraja\` 
    ADD COLUMN \`waitlist_position\` int DEFAULT NULL 
    AFTER \`status_kuota\`
  `;

  // Add waitlist_promoted_at timestamp
  const query3 = `
    ALTER TABLE \`pendaftaran_lakaraja\` 
    ADD COLUMN \`waitlist_promoted_at\` timestamp NULL DEFAULT NULL 
    AFTER \`waitlist_position\`
  `;

  await pool.query(query1);
  console.log('✅ Migration: status_kuota column added');
  
  await pool.query(query2);
  console.log('✅ Migration: waitlist_position column added');
  
  await pool.query(query3);
  console.log('✅ Migration: waitlist_promoted_at column added');

  // Set existing approved registrations to have status_kuota = 'approved'
  await pool.query(`
    UPDATE pendaftaran_lakaraja 
    SET status_kuota = 'approved' 
    WHERE status_pendaftaran = 'approved'
  `);
  console.log('✅ Migration: Existing approved registrations updated');
};

const down = async () => {
  await pool.query('ALTER TABLE `pendaftaran_lakaraja` DROP COLUMN `waitlist_promoted_at`');
  await pool.query('ALTER TABLE `pendaftaran_lakaraja` DROP COLUMN `waitlist_position`');
  await pool.query('ALTER TABLE `pendaftaran_lakaraja` DROP COLUMN `status_kuota`');
  console.log('✅ Rollback: Waiting list columns removed');
};

module.exports = { up, down };
