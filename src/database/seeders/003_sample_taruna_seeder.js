const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

const run = async () => {
  // Sample taruna data
  const tarunaData = [
    { nis: '2024001', nama: 'Ahmad Rizki', kelas: 'X-1', no_telepon: '081234567001' },
    { nis: '2024002', nama: 'Siti Aminah', kelas: 'X-1', no_telepon: '081234567002' },
    { nis: '2024003', nama: 'Budi Santoso', kelas: 'X-2', no_telepon: '081234567003' },
    { nis: '2024004', nama: 'Dewi Lestari', kelas: 'XI-1', no_telepon: '081234567004' },
    { nis: '2024005', nama: 'Eko Prasetyo', kelas: 'XI-2', no_telepon: '081234567005' },
  ];

  const hashedPassword = await bcrypt.hash('taruna123', 10);

  for (const taruna of tarunaData) {
    // Check if taruna already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE nis = ?', [taruna.nis]);
    
    if (existing.length > 0) {
      console.log(`⚠️  Taruna ${taruna.nis} already exists, skipping...`);
      continue;
    }

    const query = `
      INSERT INTO users (nis, password, nama_lengkap, kelas, no_telepon, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      taruna.nis,
      hashedPassword,
      taruna.nama,
      taruna.kelas,
      taruna.no_telepon,
      'taruna',
      1
    ]);

    console.log(`✅ Seeder: Taruna ${taruna.nama} created`);
  }

  console.log('');
  console.log('📋 Sample Taruna Accounts:');
  console.log('   Password for all: taruna123');
  tarunaData.forEach(t => {
    console.log(`   - NIS: ${t.nis} | ${t.nama}`);
  });
};

module.exports = { run };
