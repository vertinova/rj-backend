const db = require('../config/database');

class Taruna {
  // Create new pendaftaran
  static async create(data) {
    const {
      user_id, nama_lengkap, alamat, tempat_lahir, tanggal_lahir,
      jenis_kelamin, tinggi_badan, berat_badan, kelas, nama_orangtua,
      nomor_whatsapp, email, alasan, pendidikan_terakhir, pilihan_kampus,
      foto_diri, surat_izin_orangtua, surat_keterangan_sehat
    } = data;

    const [result] = await db.execute(
      `INSERT INTO calon_taruna (
        user_id, nama_lengkap, alamat, tempat_lahir, tanggal_lahir,
        jenis_kelamin, tinggi_badan, berat_badan, kelas, nama_orangtua,
        nomor_whatsapp, email, alasan, pendidikan_terakhir, pilihan_kampus,
        foto_diri, surat_izin_orangtua, surat_keterangan_sehat,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        user_id, nama_lengkap, alamat, tempat_lahir, tanggal_lahir,
        jenis_kelamin, tinggi_badan, berat_badan, kelas, nama_orangtua,
        nomor_whatsapp, email, alasan, pendidikan_terakhir, pilihan_kampus,
        foto_diri, surat_izin_orangtua, surat_keterangan_sehat
      ]
    );
    return result.insertId;
  }

  // Find by user_id
  static async findByUserId(user_id) {
    const [rows] = await db.execute(
      'SELECT * FROM calon_taruna WHERE user_id = ?',
      [user_id]
    );
    return rows[0];
  }

  // Find by id
  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM calon_taruna WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Get all with filters
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM calon_taruna WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.kelas) {
      query += ' AND kelas = ?';
      params.push(filters.kelas);
    }

    if (filters.pilihan_kampus) {
      query += ' AND pilihan_kampus = ?';
      params.push(filters.pilihan_kampus);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Update status
  static async updateStatus(id, status) {
    const [result] = await db.execute(
      'UPDATE calon_taruna SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  // Update profile data
  static async update(id, data) {
    const fields = [];
    const values = [];

    // Build dynamic update query
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE calon_taruna SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.execute(query, values);
    return result.affectedRows > 0;
  }

  // Update nomor KTA
  static async updateNomorKTA(id, nomor_kta) {
    const [result] = await db.execute(
      'UPDATE calon_taruna SET nomor_kta = ?, updated_at = NOW() WHERE id = ?',
      [nomor_kta, id]
    );
    return result.affectedRows > 0;
  }

  // Delete pendaftaran
  static async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM calon_taruna WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Get statistics
  static async getStatistics() {
    const [[total]] = await db.execute(
      'SELECT COUNT(*) as total FROM calon_taruna'
    );
    const [[pending]] = await db.execute(
      'SELECT COUNT(*) as pending FROM calon_taruna WHERE status = "pending"'
    );
    const [[lolos]] = await db.execute(
      'SELECT COUNT(*) as lolos FROM calon_taruna WHERE status = "lolos"'
    );
    const [[tidakLolos]] = await db.execute(
      'SELECT COUNT(*) as tidak_lolos FROM calon_taruna WHERE status = "tidak lolos"'
    );

    return {
      total: total.total,
      pending: pending.pending,
      lolos: lolos.lolos,
      tidak_lolos: tidakLolos.tidak_lolos
    };
  }
}

module.exports = Taruna;
