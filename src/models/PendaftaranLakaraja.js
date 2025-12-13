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

  // Create new registration with auto-approve (siapa cepat dia dapat)
  static async createAutoApproved(data) {
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
      VALUES (?, ?, ?, ?, ?, ?, 'approved')
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
      sd: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE kategori = "SD"',
      smp: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE kategori = "SMP"',
      sma: 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE kategori = "SMA"'
    };

    const stats = {};
    for (const [key, query] of Object.entries(queries)) {
      const [rows] = await pool.query(query);
      stats[key] = rows[0].count;
    }

    return stats;
  }

  // Check kuota by kategori (hanya yang approved)
  static async checkKuota(kategori) {
    const KUOTA = {
      SD: 10,
      SMP: 25,
      SMA: 25
    };

    const query = 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE kategori = ? AND status_pendaftaran = "approved"';
    const [rows] = await pool.query(query, [kategori]);
    const current = rows[0].count;
    const max = KUOTA[kategori] || 0;

    return {
      kategori,
      current,
      max,
      available: max - current,
      isFull: current >= max
    };
  }

  // Check kuota by kategori (semua yang terdaftar, termasuk pending)
  // Untuk workflow auto-approve: siapa cepat dia dapat
  static async checkKuotaRegistered(kategori) {
    const KUOTA = {
      SD: 10,
      SMP: 25,
      SMA: 25
    };

    const query = 'SELECT COUNT(*) as count FROM pendaftaran_lakaraja WHERE kategori = ?';
    const [rows] = await pool.query(query, [kategori]);
    const current = rows[0].count;
    const max = KUOTA[kategori] || 0;

    return {
      kategori,
      current,
      max,
      available: max - current,
      isFull: current >= max
    };
  }

  // Get all kuota status
  static async getAllKuotaStatus() {
    const kategoris = ['SD', 'SMP', 'SMA'];
    const kuotaStatus = {};

    for (const kategori of kategoris) {
      kuotaStatus[kategori] = await this.checkKuotaRegistered(kategori);
    }

    return kuotaStatus;
  }

  // Update team data
  static async updateTeamData(userId, data) {
    const {
      jumlah_pasukan,
      surat_keterangan,
      foto_team,
      data_anggota // JSON string
    } = data;

    const query = `
      UPDATE pendaftaran_lakaraja 
      SET jumlah_pasukan = ?, 
          surat_keterangan = ?, 
          foto_team = ?, 
          data_anggota = ?,
          is_team_complete = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;

    const [result] = await pool.query(query, [
      jumlah_pasukan,
      surat_keterangan || null,
      foto_team || null,
      data_anggota || null,
      userId
    ]);

    return result.affectedRows > 0;
  }

  // Check if team data is complete
  static async isTeamComplete(userId) {
    const query = 'SELECT is_team_complete FROM pendaftaran_lakaraja WHERE user_id = ?';
    const [rows] = await pool.query(query, [userId]);
    return rows.length > 0 && rows[0].is_team_complete === 1;
  }
}

module.exports = PendaftaranLakaraja;
