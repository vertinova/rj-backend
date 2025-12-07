const db = require('../config/database');

class Absensi {
  // Create absensi
  static async create(data) {
    const { user_id, username, kampus, status_absensi, tanggal_absensi, waktu_absensi, foto_absensi, keterangan } = data;
    
    const [result] = await db.execute(
      `INSERT INTO absensi (user_id, username, kampus, status_absensi, tanggal_absensi, waktu_absensi, foto_absensi, keterangan, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, username || null, kampus || null, status_absensi || 'hadir', tanggal_absensi, waktu_absensi || null, foto_absensi || null, keterangan || null]
    );
    return result.insertId;
  }

  // Find by user_id and date range
  static async findByUserIdAndDateRange(user_id, startDate, endDate) {
    const [rows] = await db.execute(
      `SELECT * FROM absensi 
       WHERE user_id = ? AND tanggal_absensi BETWEEN ? AND ?
       ORDER BY tanggal_absensi DESC`,
      [user_id, startDate, endDate]
    );
    return rows;
  }

  // Find by user_id
  static async findByUserId(user_id) {
    const [rows] = await db.execute(
      `SELECT * FROM absensi WHERE user_id = ? ORDER BY tanggal_absensi DESC`,
      [user_id]
    );
    return rows;
  }

  // Get all with filters
  static async getAll(filters = {}) {
    let query = `
      SELECT a.*, u.username, ct.nama_lengkap 
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN calon_taruna ct ON a.user_id = ct.user_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate && filters.endDate) {
      query += ' AND a.tanggal_absensi BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.user_id) {
      query += ' AND a.user_id = ?';
      params.push(filters.user_id);
    }

    query += ' ORDER BY a.tanggal_absensi DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Delete absensi
  static async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM absensi WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Check if already present today
  static async checkTodayPresence(user_id, date) {
    const [rows] = await db.execute(
      'SELECT id FROM absensi WHERE user_id = ? AND DATE(tanggal_absensi) = DATE(?)',
      [user_id, date]
    );
    return rows.length > 0;
  }
}

module.exports = Absensi;
