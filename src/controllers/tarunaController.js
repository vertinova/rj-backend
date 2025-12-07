const Taruna = require('../models/Taruna');
const Absensi = require('../models/Absensi');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

class TarunaController {
  // Submit pendaftaran
  static async submitPendaftaran(req, res) {
    try {
      const userId = req.user.id;

      // Check if already registered
      const existing = await Taruna.findByUserId(userId);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Anda sudah mendaftar sebelumnya'
        });
      }

      // Check if files are uploaded
      if (!req.files || !req.files.foto_diri || !req.files.surat_izin_orangtua || !req.files.surat_keterangan_sehat) {
        return res.status(400).json({
          success: false,
          message: 'Semua dokumen wajib diunggah (foto diri, surat izin, surat sehat)'
        });
      }

      const data = {
        user_id: userId,
        ...req.body,
        foto_diri: req.files.foto_diri[0].filename,
        surat_izin_orangtua: req.files.surat_izin_orangtua[0].filename,
        surat_keterangan_sehat: req.files.surat_keterangan_sehat[0].filename
      };

      const pendaftaranId = await Taruna.create(data);

      logger.info(`New pendaftaran submitted by user ID: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Pendaftaran berhasil disubmit. Mohon menunggu verifikasi admin.',
        data: { pendaftaranId }
      });
    } catch (error) {
      logger.error(`Submit pendaftaran error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat submit pendaftaran'
      });
    }
  }

  // Get pendaftaran status
  static async getPendaftaranStatus(req, res) {
    try {
      const userId = req.user.id;
      const pendaftaran = await Taruna.findByUserId(userId);

      if (!pendaftaran) {
        return res.json({
          success: true,
          data: {
            status: 'belum_daftar',
            pendaftaran: null
          }
        });
      }

      // Map jenis_kelamin untuk frontend
      if (pendaftaran.jenis_kelamin === 'Laki-laki') {
        pendaftaran.jenis_kelamin = 'L';
      } else if (pendaftaran.jenis_kelamin === 'Perempuan') {
        pendaftaran.jenis_kelamin = 'P';
      }

      res.json({
        success: true,
        data: {
          status: pendaftaran.status,
          pendaftaran
        }
      });
    } catch (error) {
      logger.error(`Get pendaftaran status error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil status pendaftaran'
      });
    }
  }

  // Check profile completeness
  static async checkProfileCompleteness(req, res) {
    try {
      const userId = req.user.id;
      const pendaftaran = await Taruna.findByUserId(userId);

      if (!pendaftaran) {
        return res.json({
          success: true,
          data: {
            isComplete: false,
            missingFields: ['Belum melakukan pendaftaran'],
            message: 'Anda harus melakukan pendaftaran terlebih dahulu'
          }
        });
      }

      // Required fields untuk bisa absensi
      const requiredFields = [
        { field: 'jenis_kelamin', label: 'Jenis Kelamin' },
        { field: 'tanggal_lahir', label: 'Tanggal Lahir' },
        { field: 'tempat_lahir', label: 'Tempat Lahir' },
        { field: 'tinggi_badan', label: 'Tinggi Badan' },
        { field: 'berat_badan', label: 'Berat Badan' },
        { field: 'nama_orangtua', label: 'Nama Orang Tua' },
        { field: 'alamat', label: 'Alamat' },
        { field: 'no_telepon', label: 'No Telepon' },
        { field: 'pendidikan_terakhir', label: 'Pendidikan Terakhir' },
        { field: 'foto_diri', label: 'Foto Diri' },
        { field: 'surat_izin_orangtua', label: 'Surat Izin Orang Tua' },
        { field: 'surat_keterangan_sehat', label: 'Surat Keterangan Sehat' }
      ];

      const missingFields = [];
      for (const { field, label } of requiredFields) {
        if (!pendaftaran[field] || pendaftaran[field] === '' || pendaftaran[field] === null) {
          missingFields.push(label);
        }
      }

      const isComplete = missingFields.length === 0;

      res.json({
        success: true,
        data: {
          isComplete,
          missingFields,
          message: isComplete 
            ? 'Profil sudah lengkap' 
            : `Harap lengkapi data: ${missingFields.join(', ')}`
        }
      });
    } catch (error) {
      logger.error(`Check profile completeness error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memeriksa kelengkapan profil'
      });
    }
  }

  // Submit absensi
  static async submitAbsensi(req, res) {
    try {
      const userId = req.user.id;
      const { tanggal_absensi, status_absensi, tipe_absensi, kampus, keterangan } = req.body;

      // Validate tipe_absensi
      if (!tipe_absensi || !['datang', 'pulang'].includes(tipe_absensi)) {
        return res.status(400).json({
          success: false,
          message: 'Tipe absensi tidak valid (datang/pulang)'
        });
      }

      // CHECK PROFILE COMPLETENESS FIRST
      const pendaftaran = await Taruna.findByUserId(userId);
      if (!pendaftaran) {
        return res.status(400).json({
          success: false,
          message: 'Anda harus melakukan pendaftaran terlebih dahulu'
        });
      }

      // Required fields validation
      const requiredFields = [
        { field: 'jenis_kelamin', label: 'Jenis Kelamin' },
        { field: 'tanggal_lahir', label: 'Tanggal Lahir' },
        { field: 'tempat_lahir', label: 'Tempat Lahir' },
        { field: 'tinggi_badan', label: 'Tinggi Badan' },
        { field: 'berat_badan', label: 'Berat Badan' },
        { field: 'nama_orangtua', label: 'Nama Orang Tua' },
        { field: 'alamat', label: 'Alamat' },
        { field: 'no_telepon', label: 'No Telepon' },
        { field: 'pendidikan_terakhir', label: 'Pendidikan Terakhir' },
        { field: 'foto_diri', label: 'Foto Diri' },
        { field: 'surat_izin_orangtua', label: 'Surat Izin Orang Tua' },
        { field: 'surat_keterangan_sehat', label: 'Surat Keterangan Sehat' }
      ];

      const missingFields = [];
      for (const { field, label } of requiredFields) {
        if (!pendaftaran[field] || pendaftaran[field] === '' || pendaftaran[field] === null) {
          missingFields.push(label);
        }
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Harap lengkapi profil Anda terlebih dahulu',
          missingFields: missingFields
        });
      }

      // Check if already present today for specific type
      const alreadyPresent = await Absensi.checkTodayPresence(userId, tanggal_absensi, tipe_absensi);
      if (alreadyPresent) {
        const tipeLabel = tipe_absensi === 'datang' ? 'Absen Latihan' : 'Absen Pulang';
        return res.status(400).json({
          success: false,
          message: `Anda sudah melakukan ${tipeLabel} hari ini`
        });
      }

      // If doing absen pulang, check if already did absen datang
      if (tipe_absensi === 'pulang') {
        const hasAbsenDatang = await Absensi.checkTodayPresence(userId, tanggal_absensi, 'datang');
        if (!hasAbsenDatang) {
          return res.status(400).json({
            success: false,
            message: 'Anda harus melakukan Absen Latihan terlebih dahulu sebelum Absen Pulang'
          });
        }
      }

      // Validation based on status
      if (status_absensi === 'hadir') {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Foto absensi wajib diunggah untuk status hadir'
          });
        }
        if (!kampus) {
          return res.status(400).json({
            success: false,
            message: 'Kampus wajib dipilih untuk status hadir'
          });
        }
      } else if (status_absensi === 'izin' || status_absensi === 'sakit') {
        if (!keterangan) {
          return res.status(400).json({
            success: false,
            message: 'Keterangan wajib diisi untuk status izin/sakit'
          });
        }
      }

      const now = new Date();
      const waktu_absensi = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS

      const data = {
        user_id: userId,
        username: req.user.username,
        kampus: kampus || null,
        status_absensi: status_absensi || 'hadir',
        tipe_absensi: tipe_absensi || 'datang',
        tanggal_absensi,
        waktu_absensi,
        foto_absensi: req.file ? req.file.filename : null,
        keterangan: keterangan || null
      };

      const absensiId = await Absensi.create(data);

      const tipeLabel = tipe_absensi === 'datang' ? 'Absen Latihan' : 'Absen Pulang';
      logger.info(`Absensi submitted by user ID: ${userId} on ${tanggal_absensi} with status: ${status_absensi}, type: ${tipe_absensi}`);

      res.status(201).json({
        success: true,
        message: `${tipeLabel} berhasil dicatat`,
        data: { absensiId, tipe_absensi }
      });
    } catch (error) {
      logger.error(`Submit absensi error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat submit absensi'
      });
    }
  }

  // Get absensi history
  static async getAbsensiHistory(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      let absensi;
      if (startDate && endDate) {
        absensi = await Absensi.findByUserIdAndDateRange(userId, startDate, endDate);
      } else {
        absensi = await Absensi.findByUserId(userId);
      }

      res.json({
        success: true,
        data: absensi
      });
    } catch (error) {
      logger.error(`Get absensi history error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil riwayat absensi'
      });
    }
  }

  // Update profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      
      // Check if pendaftaran exists
      const existing = await Taruna.findByUserId(userId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Data pendaftaran tidak ditemukan. Silakan daftar terlebih dahulu.'
        });
      }

      // Prepare update data
      const updateData = {
        nama_lengkap: req.body.nama_lengkap,
        jenis_kelamin: req.body.jenis_kelamin === 'L' ? 'Laki-laki' : req.body.jenis_kelamin === 'P' ? 'Perempuan' : req.body.jenis_kelamin,
        tempat_lahir: req.body.tempat_lahir,
        tanggal_lahir: req.body.tanggal_lahir,
        tinggi_badan: req.body.tinggi_badan,
        berat_badan: req.body.berat_badan,
        nama_orangtua: req.body.nama_orangtua,
        alamat: req.body.alamat,
        no_telepon: req.body.no_telepon || req.body.nomor_whatsapp,
        pendidikan_terakhir: req.body.pendidikan_terakhir,
        kampus: req.body.kampus,
        tingkat: req.body.tingkat,
        kelas: req.body.kelas
      };

      // Handle file uploads
      if (req.files) {
        if (req.files.foto_diri) {
          // Delete old file if exists
          if (existing.foto_diri) {
            const oldPath = path.join(__dirname, '../../uploads', existing.foto_diri);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
          updateData.foto_diri = req.files.foto_diri[0].filename;
        }
        
        if (req.files.surat_izin_orangtua) {
          if (existing.surat_izin_orangtua) {
            const oldPath = path.join(__dirname, '../../uploads', existing.surat_izin_orangtua);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
          updateData.surat_izin_orangtua = req.files.surat_izin_orangtua[0].filename;
        }
        
        if (req.files.surat_keterangan_sehat) {
          if (existing.surat_keterangan_sehat) {
            const oldPath = path.join(__dirname, '../../uploads', existing.surat_keterangan_sehat);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
          updateData.surat_keterangan_sehat = req.files.surat_keterangan_sehat[0].filename;
        }
      }

      // Update in database
      await Taruna.update(existing.id, updateData);
      
      // Get updated data
      const updatedData = await Taruna.findByUserId(userId);

      logger.info(`Profile updated by user ID: ${userId}`);

      res.json({
        success: true,
        message: 'Profile berhasil diupdate',
        data: updatedData
      });
    } catch (error) {
      logger.error(`Update profile error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat update profile'
      });
    }
  }
}

module.exports = TarunaController;
