const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get Dashboard Statistics
exports.getStatistics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Date filter based on period
    let dateFilter = '';
    if (period !== 'all') {
      const now = new Date();
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND tanggal_daftar >= '${weekAgo.toISOString().split('T')[0]}'`;
      } else if (period === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFilter = `AND tanggal_daftar >= '${monthAgo.toISOString().split('T')[0]}'`;
      } else if (period === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFilter = `AND tanggal_daftar >= '${yearAgo.toISOString().split('T')[0]}'`;
      }
    }
    
    // === PENDAFTAR STATISTICS ===
    const [pendaftarStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'lolos' THEN 1 ELSE 0 END), 0) as lolos,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'tidak lolos' THEN 1 ELSE 0 END), 0) as ditolak
      FROM calon_taruna
      WHERE 1=1 ${dateFilter}
    `);
    
    // === ABSENSI STATISTICS ===
    const absensiDateFilter = dateFilter.replace('tanggal_daftar', 'tanggal_absensi');
    
    const [absensiStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status_absensi = 'hadir' THEN 1 ELSE 0 END), 0) as hadir,
        COALESCE(SUM(CASE WHEN status_absensi = 'izin' THEN 1 ELSE 0 END), 0) as izin,
        COALESCE(SUM(CASE WHEN status_absensi = 'sakit' THEN 1 ELSE 0 END), 0) as sakit
      FROM absensi
      WHERE 1=1 ${absensiDateFilter}
    `);
    
    // Attendance rate calculation
    const totalAbsensi = parseInt(absensiStats[0].total) || 0;
    const hadirCount = parseInt(absensiStats[0].hadir) || 0;
    const attendance_rate = totalAbsensi > 0 ? ((hadirCount / totalAbsensi) * 100).toFixed(1) : 0;
    
    // Absensi by Kampus
    const [absensiByKampus] = await db.query(`
      SELECT 
        kampus,
        COUNT(*) as total
      FROM absensi
      WHERE kampus IS NOT NULL AND kampus != '' ${absensiDateFilter}
      GROUP BY kampus
      ORDER BY total DESC
    `);
    
    // === GENDER STATISTICS (Only Lolos/Taruna) ===
    const genderDateFilter = dateFilter.replace('tanggal_daftar', 'tanggal_daftar');
    const [genderStats] = await db.query(`
      SELECT 
        jenis_kelamin,
        COUNT(*) as total
      FROM calon_taruna
      WHERE status = 'lolos' AND jenis_kelamin IS NOT NULL ${genderDateFilter}
      GROUP BY jenis_kelamin
    `);
    
    // Calculate gender totals (only taruna/lolos)
    const lakiLaki = genderStats.find(g => g.jenis_kelamin === 'Laki-laki')?.total || 0;
    const perempuan = genderStats.find(g => g.jenis_kelamin === 'Perempuan')?.total || 0;
    const totalGender = lakiLaki + perempuan;

    res.json({
      success: true,
      data: {
        pendaftar: {
          total: pendaftarStats[0].total || 0,
          lolos: pendaftarStats[0].lolos || 0,
          pending: pendaftarStats[0].pending || 0,
          ditolak: pendaftarStats[0].ditolak || 0,
          byMonth: []
        },
        absensi: {
          total: totalAbsensi,
          hadir: hadirCount,
          izin: absensiStats[0].izin || 0,
          sakit: absensiStats[0].sakit || 0,
          byKampus: absensiByKampus,
          byDate: [],
          attendance_rate: parseFloat(attendance_rate)
        },
        gender: {
          total: totalGender,
          laki_laki: lakiLaki,
          perempuan: perempuan,
          distribution: genderStats,
          percentage_laki: totalGender > 0 ? ((lakiLaki / totalGender) * 100).toFixed(1) : 0,
          percentage_perempuan: totalGender > 0 ? ((perempuan / totalGender) * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik',
      error: error.message
    });
  }
};

// Get All Pendaftar
exports.getPendaftar = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    let baseQuery = `
      FROM calon_taruna ct
      JOIN users u ON ct.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    if (status && status !== 'all') {
      baseQuery += ' AND ct.status = ?';
      params.push(status);
      countParams.push(status);
    }
    
    if (search) {
      baseQuery += ' AND (ct.nama_lengkap LIKE ? OR ct.email LIKE ? OR u.username LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await db.query(countQuery, countParams);
    const totalItems = countResult[0].total;
    
    // Get data with pagination
    const dataQuery = `
      SELECT 
        ct.*,
        u.username,
        u.email as user_email,
        u.role
      ${baseQuery}
      ORDER BY ct.tanggal_daftar DESC 
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));
    
    const [pendaftar] = await db.query(dataQuery, params);
    
    res.json({
      success: true,
      data: pendaftar,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Error getting pendaftar:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pendaftar',
      error: error.message
    });
  }
};

// Update Pendaftar Status
exports.updatePendaftarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, nomor_kta } = req.body;
    
    if (!['pending', 'lolos', 'tidak lolos'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }
    
    const updates = { status };
    if (status === 'lolos' && nomor_kta) {
      updates.nomor_kta = nomor_kta;
    }
    
    const [result] = await db.query(
      'UPDATE calon_taruna SET ? WHERE id = ?',
      [updates, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data pendaftar tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: `Status pendaftar berhasil diubah menjadi ${status}`
    });
  } catch (error) {
    console.error('Error updating pendaftar status:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengubah status pendaftar',
      error: error.message
    });
  }
};

// Get All Users
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    let baseQuery = 'FROM users WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (role && role !== 'all') {
      baseQuery += ' AND role = ?';
      params.push(role);
      countParams.push(role);
    }
    
    if (search) {
      baseQuery += ' AND (username LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await db.query(countQuery, countParams);
    const totalItems = countResult[0].total;
    
    // Get data with pagination
    const dataQuery = `SELECT id, username, email, role, created_at ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [users] = await db.query(dataQuery, params);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data users',
      error: error.message
    });
  }
};

// Reset User Password
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru harus minimal 6 karakter'
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Password berhasil direset'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mereset password',
      error: error.message
    });
  }
};

// Get Absensi
exports.getAbsensi = async (req, res) => {
  try {
    const { startDate, endDate, search, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    let baseQuery = `
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    if (startDate) {
      baseQuery += ' AND a.tanggal_absensi >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }
    
    if (endDate) {
      baseQuery += ' AND a.tanggal_absensi <= ?';
      params.push(endDate);
      countParams.push(endDate);
    }
    
    if (search) {
      baseQuery += ' AND (a.username LIKE ? OR u.email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await db.query(countQuery, countParams);
    const totalItems = countResult[0].total;
    
    // Get data with pagination
    const dataQuery = `
      SELECT 
        a.*,
        u.username,
        u.email
      ${baseQuery}
      ORDER BY a.tanggal_absensi DESC, a.waktu_absensi DESC 
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));
    
    const [absensi] = await db.query(dataQuery, params);
    
    res.json({
      success: true,
      data: absensi,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Error getting absensi:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data absensi',
      error: error.message
    });
  }
};

// Generate KTA Number
exports.generateKTA = async (req, res) => {
  try {
    const { pendaftarId } = req.body;
    
    // Get pendaftar data
    const [pendaftar] = await db.query(
      'SELECT * FROM calon_taruna WHERE id = ? AND status = "lolos"',
      [pendaftarId]
    );
    
    if (pendaftar.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pendaftar tidak ditemukan atau belum lolos'
      });
    }
    
    // Generate KTA number format: KTA-YYYY-XXXX
    const year = new Date().getFullYear();
    const [lastKTA] = await db.query(
      'SELECT nomor_kta FROM calon_taruna WHERE nomor_kta LIKE ? ORDER BY nomor_kta DESC LIMIT 1',
      [`KTA-${year}-%`]
    );
    
    let newNumber = 1;
    if (lastKTA.length > 0 && lastKTA[0].nomor_kta) {
      const lastNumber = parseInt(lastKTA[0].nomor_kta.split('-')[2]);
      newNumber = lastNumber + 1;
    }
    
    const nomorKTA = `KTA-${year}-${String(newNumber).padStart(4, '0')}`;
    
    // Update nomor_kta
    await db.query(
      'UPDATE calon_taruna SET nomor_kta = ? WHERE id = ?',
      [nomorKTA, pendaftarId]
    );
    
    res.json({
      success: true,
      message: 'Nomor KTA berhasil digenerate',
      data: {
        nomor_kta: nomorKTA,
        pendaftar: pendaftar[0]
      }
    });
  } catch (error) {
    console.error('Error generating KTA:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal generate nomor KTA',
      error: error.message
    });
  }
};

module.exports = exports;
