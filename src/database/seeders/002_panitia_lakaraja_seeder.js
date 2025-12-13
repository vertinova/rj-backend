const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

const run = async () => {
  // Check if panitia already exists
  const [existing] = await pool.query('SELECT id FROM users_lakaraja WHERE username = ?', ['panitia']);
  
  if (existing.length > 0) {
    console.log('⚠️  Panitia user already exists, skipping...');
    return;
  }

  const hashedPassword = await bcrypt.hash('panitia123', 10);

  const query = `
    INSERT INTO users_lakaraja (username, email, password, nama_lengkap, no_telepon, role, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await pool.query(query, [
    'panitia',
    'panitia@lakaraja.com',
    hashedPassword,
    'Panitia Lakaraja',
    '081234567890',
    'panitia',
    1
  ]);

  console.log('✅ Seeder: Panitia Lakaraja user created');
  console.log('   Username: panitia');
  console.log('   Password: panitia123');
};

module.exports = { run };
