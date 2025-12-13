const pool = require('../config/database');

class PendaftaranLakaraja {
  // Create new registration
  static async create(data) {
    const {
      user_id,
      nama_sekolah,
      nama_satuan,
      kategori,
      logo_satuan,
      bukti_payment
    } = data;

    const query = `
      INSERT INTO pendaftaran_lakaraja 
      (user_id, nama_sekolah, nama_satuan, kategori, logo_satuan, bukti_payment, status_pendaftaran)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await pool.query(query, [
      user_id,
      nama_sekolah,
      nama_satuan,
      kategori,
      logo_satuan || null,
      bukti_payment || null
    ]);

    return result.insertId;
  }

  // Find by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT p.*, u.email, u.nama_lengkap, u.no_telepon
      FROM pendaftaran_lakaraja p
      JOIN users_lakaraja u ON p.user_id = u.id
      WHERE p.user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0];
  }

  // Check if user already registered
  static async isUserRegistered(userId) {
    const query = 'SELECT id FROM pendaftaran_lakaraja WHERE user_id = ?';
    const [rows] = await pool.query(query, [userId]);
    return rows.length > 0;
  }

  // Find by ID
  static async findById(id) {
    const query = `
      SELECT p.*, u.email, u.nama_lengkap, u.no_telepon
      FROM pendaftaran_lakaraja p
      JOIN users_lakaraja u ON p.user_id = u.id
      WHERE p.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // Get all registrations with filters
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        p.*,
        u.email,
        u.nama_lengkap,
        u.no_telepon
      FROM pendaftaran_lakaraja p
      JOIN users_lakaraja u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.kategori) {
      query += ' AND p.kategori = ?';
      params.push(filters.kategori);
    }

    if (filters.status_pendaftaran) {
      query += ' AND p.status_pendaftaran = ?';
      params.push(filters.status_pendaftaran);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Update registration data
  static async update(id, data) {
    const {
      nama_sekolah,
      nama_satuan,
      kategori,
      logo_satuan,
      bukti_payment
    } = data;

    let query = `
      UPDATE pendaftaran_lakaraja 
      SET nama_sekolah = ?, nama_satuan = ?, kategori = ?, updated_at = CURRENT_TIMESTAMP
    `;
    const params = [nama_sekolah, nama_satuan, kategori];

    if (logo_satuan) {
      query += ', logo_satuan = ?';
      params.push(logo_satuan);
    }

    if (bukti_payment) {
      query += ', bukti_payment = ?';
      params.push(bukti_payment);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  }

  // Update status (for panitia)
  static async updateStatus(id, status, catatan = null) {
    const query = `
      UPDATE pendaftaran_lakaraja 
      SET status_pendaftaran = ?, catatan_panitia = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const [result] = await pool.query(query, [status, catatan, id]);
    return result.affectedRows > 0;
  }

  // Delete registration
  static async delete(id) {
    const query = 'DELETE FROM pendaftaran_lakaraja WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  }

  // Get statistics
  static async getStatistics() {
    const queries = {
      total: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja',
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

module.exports = PendaftaranLakaraja;
