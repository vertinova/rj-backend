const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

const run = async () => {
  // Check if admin already exists
  const [existing] = await pool.query('SELECT id FROM users WHERE nis = ?', ['admin']);
  
  if (existing.length > 0) {
    console.log('⚠️  Admin user already exists, skipping...');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const query = `
    INSERT INTO users (nis, email, password, nama_lengkap, role, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await pool.query(query, [
    'admin',
    'admin@paskibmansabo.com',
    hashedPassword,
    'Administrator',
    'admin',
    1
  ]);

  console.log('✅ Seeder: Admin user created');
  console.log('   NIS: admin');
  console.log('   Password: admin123');
};

module.exports = { run };
