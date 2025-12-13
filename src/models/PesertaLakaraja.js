const pool = require('../config/database');

class UserLakaraja {
  // Create new user lakaraja (account only)
  static async create(data) {
    const { username, password, no_telepon, role = 'peserta' } = data;

    const query = `
      INSERT INTO users_lakaraja (username, password, no_telepon, role)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [username, password, no_telepon, role]);
    return result.insertId;
  }

  // Find by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users_lakaraja WHERE username = ?';
    const [rows] = await pool.query(query, [username]);
    return rows[0];
  }

  // Check if username exists
  static async usernameExists(username) {
    const query = 'SELECT id FROM users_lakaraja WHERE username = ?';
    const [rows] = await pool.query(query, [username]);
    return rows.length > 0;
  }

  // Find by ID
  static async findById(id) {
    const query = 'SELECT * FROM users_lakaraja WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Get all users (for panitia)
  static async getAll(filters = {}) {
    let query = 'SELECT id, username, no_telepon, role, is_active, created_at FROM users_lakaraja WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Update profile
  static async update(id, data) {
    const { nama_lengkap, no_telepon } = data;

    const query = `
      UPDATE users_lakaraja 
      SET nama_lengkap = ?, no_telepon = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await pool.query(query, [nama_lengkap, no_telepon, id]);
    return result.affectedRows > 0;
  }

  // Update password
  static async updatePassword(id, hashedPassword) {
    const query = 'UPDATE users_lakaraja SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const [result] = await pool.query(query, [hashedPassword, id]);
    return result.affectedRows > 0;
  }

  // Toggle active status
  static async toggleActive(id, isActive) {
    const query = 'UPDATE users_lakaraja SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const [result] = await pool.query(query, [isActive, id]);
    return result.affectedRows > 0;
  }

  // Delete
  static async delete(id) {
    const query = 'DELETE FROM users_lakaraja WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  }

  // Get user with their registration
  static async getUserWithRegistration(userId) {
    const query = `
      SELECT 
        u.*,
        p.id as pendaftaran_id,
        p.nama_sekolah,
        p.nama_satuan,
        p.kategori,
        p.logo_satuan,
        p.bukti_payment,
        p.status_pendaftaran,
        p.catatan_panitia,
        p.created_at as tanggal_daftar
      FROM users_lakaraja u
      LEFT JOIN pendaftaran_lakaraja p ON u.id = p.user_id
      WHERE u.id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0];
  }

  // Get statistics
  static async getStatistics() {
    const queries = {
      total_users: 'SELECT COUNT(*) as count FROM users_lakaraja WHERE role = "peserta"',
      active_users: 'SELECT COUNT(*) as count FROM users_lakaraja WHERE role = "peserta" AND is_active = 1',
      total_pendaftaran: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja',
      pending: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE status_pendaftaran = "pending"',
      approved: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE status_pendaftaran = "approved"',
      rejected: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE status_pendaftaran = "rejected"',
      tim: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE kategori = "tim"',
      individu: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE kategori = "individu"'
    };

    const stats = {};
    for (const [key, query] of Object.entries(queries)) {
      const [rows] = await pool.query(query);
      stats[key] = rows[0].count;
    }

    return stats;
  }
}

module.exports = UserLakaraja;
