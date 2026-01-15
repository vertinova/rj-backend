const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserLakaraja = require('../models/PesertaLakaraja'); // Renamed but keep import path
const PendaftaranLakaraja = require('../models/PendaftaranLakaraja');
const logger = require('../config/logger');

class LakarajaController {
  // Register user lakaraja (create account only)
  static async register(req, res) {
    try {
      const { username, password, no_telepon } = req.body;

      // Validasi input
      if (!username || !password || !no_telepon) {
        return res.status(400).json({
          success: false,
          message: 'Semua field wajib diisi'
        });
      }

      // Check if username already exists
      if (await UserLakaraja.usernameExists(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah terdaftar'
        });
      }

      // Check if there's any available quota before allowing registration
      const kuotaStatus = await PendaftaranLakaraja.getAllKuotaStatus();
      const hasAvailableSpots = Object.values(kuotaStatus).some(k => !k.isFull && k.available > 0);
      
      if (!hasAvailableSpots) {
        return res.status(400).json({
          success: false,
          message: 'Maaf, kuota untuk semua kategori sudah penuh. Pendaftaran ditutup.',
          quotaFull: true
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userId = await UserLakaraja.create({
        username,
        password: hashedPassword,
        no_telepon,
        role: 'peserta'
      });

      logger.info(`New Lakaraja user registered: ${username} (ID: ${userId})`);

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil! Silakan login untuk melanjutkan pendaftaran kompetisi.',
        data: { userId }
      });
    } catch (error) {
      logger.error(`Lakaraja registration error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat registrasi'
      });
    }
  }

  // Login user lakaraja
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await UserLakaraja.findByUsername(username);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }

      // Check if active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda tidak aktif. Silakan hubungi panitia.'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          role: 'user_lakaraja',
          lakaraja_role: user.role // peserta or panitia
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      logger.info(`Lakaraja user logged in: ${user.nama_lengkap} (ID: ${user.id})`);

      // Remove password from response
      delete user.password;

      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            no_telepon: user.no_telepon,
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at
          }
        }
      });
    } catch (error) {
      logger.error(`Lakaraja login error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat login'
      });
    }
  }

  // Get user profile with registration status
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const userWithReg = await UserLakaraja.getUserWithRegistration(userId);

      if (!userWithReg) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // Remove password from response
      delete userWithReg.password;

      res.json({
        success: true,
        data: userWithReg
      });
    } catch (error) {
      logger.error(`Get Lakaraja profile error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { nama_lengkap, no_telepon } = req.body;

      const updated = await UserLakaraja.update(userId, {
        nama_lengkap,
        no_telepon
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      logger.info(`Lakaraja user updated profile: ID ${userId}`);

      res.json({
        success: true,
        message: 'Profil berhasil diperbarui'
      });
    } catch (error) {
      logger.error(`Update Lakaraja profile error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memperbarui profil'
      });
    }
  }

  // Get registration by user ID
  static async getRegistration(req, res) {
    try {
      const userId = req.params.userId;
      
      const registration = await PendaftaranLakaraja.findByUserId(userId);
      
      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Data pendaftaran tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: registration
      });
    } catch (error) {
      logger.error(`Get Lakaraja registration error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data pendaftaran'
      });
    }
  }

  // Create/Submit competition registration
  static async submitRegistration(req, res) {
    try {
      const userId = req.user.id;
      const { nama_sekolah, nama_satuan, kategori } = req.body;
      const logo_satuan = req.files?.logo_satuan?.[0]?.filename;
      const bukti_payment = req.files?.bukti_payment?.[0]?.filename;

      // Check if already registered
      if (await PendaftaranLakaraja.isUserRegistered(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Anda sudah mendaftar kompetisi'
        });
      }

      // Validate required fields
      if (!nama_sekolah || !nama_satuan || !kategori) {
        return res.status(400).json({
          success: false,
          message: 'Nama sekolah, nama satuan, dan kategori wajib diisi'
        });
      }

      // Validate kategori
      if (!['SD', 'SMP', 'SMA'].includes(kategori)) {
        return res.status(400).json({
          success: false,
          message: 'Kategori tidak valid. Pilih SD, SMP, atau SMA'
        });
      }

      // Check kuota - hitung yang sudah approved + waiting list
      const kuotaInfo = await PendaftaranLakaraja.checkKuotaRegistered(kategori);
      
      // Create registration with waiting list support
      const result = await PendaftaranLakaraja.createWithWaitingList({
        user_id: userId,
        nama_sekolah,
        nama_satuan,
        kategori,
        logo_satuan,
        bukti_payment
      });

      const statusMessage = result.statusKuota === 'waiting_list' 
        ? `Kuota kategori ${kategori} sudah penuh. Pendaftaran Anda berhasil masuk ke WAITING LIST posisi #${result.waitlistPosition}. Anda akan dipromosikan otomatis jika ada slot tersedia.`
        : `Selamat! Pendaftaran Anda berhasil diterima untuk kategori ${kategori}. Anda telah terdaftar sebagai peserta Lakaraja 2026.`;

      logger.info(`New Lakaraja registration: User ID ${userId}, Reg ID ${result.insertId}, Kategori ${kategori}, Status: ${result.statusKuota}${result.waitlistPosition ? ', Waitlist #' + result.waitlistPosition : ''}`);

      // Fetch the complete registration data to return
      const registrationData = await PendaftaranLakaraja.findByUserId(userId);

      res.status(201).json({
        success: true,
        message: statusMessage,
        data: registrationData,
        waitingList: result.statusKuota === 'waiting_list',
        waitlistPosition: result.waitlistPosition
      });
    } catch (error) {
      logger.error(`Submit Lakaraja registration error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mendaftar'
      });
    }
  }

  // Update competition registration
  static async updateRegistration(req, res) {
    try {
      const userId = req.user.id;
      const { nama_sekolah, nama_satuan, kategori } = req.body;
      const logo_satuan = req.files?.logo_satuan?.[0]?.filename;
      const bukti_payment = req.files?.bukti_payment?.[0]?.filename;

      // Get existing registration
      const registration = await PendaftaranLakaraja.findByUserId(userId);

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Pendaftaran tidak ditemukan'
        });
      }

      // Only allow update if status is pending or rejected
      if (registration.status_pendaftaran === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Pendaftaran yang sudah disetujui tidak dapat diubah'
        });
      }

      // Update registration
      const updated = await PendaftaranLakaraja.update(registration.id, {
        nama_sekolah,
        nama_satuan,
        kategori,
        logo_satuan,
        bukti_payment
      });

      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Gagal memperbarui pendaftaran'
        });
      }

      logger.info(`Lakaraja registration updated: User ID ${userId}`);

      res.json({
        success: true,
        message: 'Pendaftaran berhasil diperbarui'
      });
    } catch (error) {
      logger.error(`Update Lakaraja registration error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memperbarui pendaftaran'
      });
    }
  }

  // Submit team data (daftar ulang)
  static async submitTeamData(req, res) {
    try {
      const userId = req.user.id;
      const { jumlah_pasukan, member_names } = req.body; // member_names is JSON string array

      // Check if user has registration
      const registration = await PendaftaranLakaraja.findByUserId(userId);
      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Pendaftaran tidak ditemukan. Silakan daftar terlebih dahulu.'
        });
      }

      // Check if team data already complete
      if (await PendaftaranLakaraja.isTeamComplete(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Data tim sudah lengkap'
        });
      }

      // Validate jumlah pasukan
      const jumlahPasukan = parseInt(jumlah_pasukan);
      if (isNaN(jumlahPasukan) || jumlahPasukan < 1 || jumlahPasukan > 30) {
        return res.status(400).json({
          success: false,
          message: 'Jumlah pasukan harus antara 1-30'
        });
      }

      // Get uploaded files
      const surat_keterangan = req.files?.surat_keterangan?.[0]?.filename;
      const foto_team = req.files?.foto_team?.[0]?.filename;
      const foto_anggota = req.files?.foto_anggota || []; // array of files

      // Validate member names
      let memberNamesArray = [];
      try {
        memberNamesArray = JSON.parse(member_names);
        if (!Array.isArray(memberNamesArray) || memberNamesArray.length !== jumlahPasukan) {
          return res.status(400).json({
            success: false,
            message: `Jumlah nama anggota harus sama dengan jumlah pasukan (${jumlahPasukan})`
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Format data nama anggota tidak valid'
        });
      }

      // Validate foto anggota count
      if (foto_anggota.length !== jumlahPasukan) {
        return res.status(400).json({
          success: false,
          message: `Jumlah foto anggota harus sama dengan jumlah pasukan (${jumlahPasukan})`
        });
      }

      // Build data_anggota array
      const dataAnggota = memberNamesArray.map((nama, index) => ({
        nama: nama,
        foto: foto_anggota[index]?.filename || null
      }));

      // Update team data
      const updated = await PendaftaranLakaraja.updateTeamData(userId, {
        jumlah_pasukan: jumlahPasukan,
        surat_keterangan,
        foto_team,
        data_anggota: JSON.stringify(dataAnggota)
      });

      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Gagal menyimpan data tim'
        });
      }

      logger.info(`Team data submitted: User ID ${userId}, Jumlah Pasukan ${jumlahPasukan}`);

      // Fetch updated registration data
      const updatedRegistration = await PendaftaranLakaraja.findByUserId(userId);

      res.json({
        success: true,
        message: 'Data tim berhasil disimpan!',
        data: updatedRegistration
      });
    } catch (error) {
      logger.error(`Submit team data error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menyimpan data tim'
      });
    }
  }

  // === PANITIA ONLY ENDPOINTS ===

  // Get all users (panitia only)
  static async getAllUsers(req, res) {
    try {
      const { role, is_active } = req.query;
      const filters = {};

      if (role) filters.role = role;
      if (is_active !== undefined) filters.is_active = is_active === 'true' ? 1 : 0;

      const users = await UserLakaraja.getAll(filters);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error(`Get all Lakaraja users error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data'
      });
    }
  }

  // Get all registrations (panitia only)
  static async getAllRegistrations(req, res) {
    try {
      const { kategori, status_pendaftaran } = req.query;
      const filters = {};

      if (kategori) filters.kategori = kategori;
      if (status_pendaftaran) filters.status_pendaftaran = status_pendaftaran;

      const registrations = await PendaftaranLakaraja.getAll(filters);

      res.json({
        success: true,
        data: registrations
      });
    } catch (error) {
      logger.error(`Get all Lakaraja registrations error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data'
      });
    }
  }

  // Update registration status (panitia only)
  static async updateRegistrationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, catatan } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status tidak valid'
        });
      }

      const updated = await PendaftaranLakaraja.updateStatus(id, status, catatan);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Pendaftaran tidak ditemukan'
        });
      }

      logger.info(`Lakaraja registration status updated: ID ${id} to ${status}`);

      res.json({
        success: true,
        message: 'Status pendaftaran berhasil diperbarui'
      });
    } catch (error) {
      logger.error(`Update Lakaraja registration status error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memperbarui status'
      });
    }
  }

  // Reset user password (panitia only)
  static async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      if (!new_password || new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 6 karakter'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      const updated = await UserLakaraja.updatePassword(id, hashedPassword);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      logger.info(`Lakaraja user password reset: ID ${id}`);

      res.json({
        success: true,
        message: 'Password berhasil direset'
      });
    } catch (error) {
      logger.error(`Reset Lakaraja user password error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mereset password'
      });
    }
  }

  // Toggle user active status (panitia only)
  static async toggleUserActive(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      const updated = await UserLakaraja.toggleActive(id, is_active ? 1 : 0);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      logger.info(`Lakaraja user active status toggled: ID ${id} to ${is_active}`);

      res.json({
        success: true,
        message: `User berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`
      });
    } catch (error) {
      logger.error(`Toggle Lakaraja user active error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengubah status'
      });
    }
  }

  // Delete user (panitia only)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const deleted = await UserLakaraja.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      logger.info(`Lakaraja user deleted: ID ${id}`);

      res.json({
        success: true,
        message: 'User berhasil dihapus'
      });
    } catch (error) {
      logger.error(`Delete Lakaraja user error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus user'
      });
    }
  }

  // Delete registration (panitia only)
  static async deleteRegistration(req, res) {
    try {
      const { id } = req.params;
      const db = require('../config/database');

      // Check if registration exists
      const [rows] = await db.query(
        'SELECT * FROM pendaftaran_lakaraja WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pendaftaran tidak ditemukan'
        });
      }

      // Delete the registration
      await db.query('DELETE FROM pendaftaran_lakaraja WHERE id = ?', [id]);

      logger.info(`Lakaraja registration deleted: ID ${id} by panitia ${req.user.id}`);

      res.json({
        success: true,
        message: 'Pendaftaran berhasil dihapus'
      });
    } catch (error) {
      logger.error(`Delete Lakaraja registration error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat menghapus pendaftaran'
      });
    }
  }

  // Reset team data only (panitia only) - keep registration intact
  static async resetTeamData(req, res) {
    try {
      const { id } = req.params;

      const registration = await PendaftaranLakaraja.findById(id);
      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Pendaftaran tidak ditemukan'
        });
      }

      const updated = await PendaftaranLakaraja.resetTeamData(id);

      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Gagal mereset data daftar ulang'
        });
      }

      logger.info(`Team data reset for registration ID ${id} by panitia ${req.user.id}`);

      res.json({
        success: true,
        message: 'Data daftar ulang berhasil direset'
      });
    } catch (error) {
      logger.error(`Reset team data error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mereset data daftar ulang'
      });
    }
  }

  // Get statistics (panitia only)
  static async getStatistics(req, res) {
    try {
      const stats = await UserLakaraja.getStatistics();
      const kuota = await PendaftaranLakaraja.getAllKuotaStatus();

      res.json({
        success: true,
        data: {
          ...stats,
          kuota
        }
      });
    } catch (error) {
      logger.error(`Get Lakaraja statistics error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil statistik'
      });
    }
  }

  // Get kuota info (public)
  static async getKuotaInfo(req, res) {
    try {
      const kuota = await PendaftaranLakaraja.getAllKuotaStatus();
      
      logger.info(`Kuota info requested: ${JSON.stringify(kuota)}`);

      res.json({
        success: true,
        data: kuota
      });
    } catch (error) {
      logger.error(`Get kuota info error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil info kuota'
      });
    }
  }

  // Check if any kuota is available (public)
  static async checkKuotaAvailability(req, res) {
    try {
      const kuota = await PendaftaranLakaraja.getAllKuotaStatus();
      
      // Check if at least one category has available spots
      const hasAvailableSpots = Object.values(kuota).some(k => !k.isFull && k.available > 0);
      
      res.json({
        success: true,
        data: {
          hasAvailableSpots,
          kuota
        }
      });
    } catch (error) {
      logger.error(`Check kuota availability error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengecek ketersediaan kuota'
      });
    }
  }

  // Get approved participants for public landing page (no auth required)
  static async getApprovedParticipants(req, res) {
    try {
      const { kategori } = req.query;
      const filters = { status_pendaftaran: 'approved' };
      
      if (kategori) {
        filters.kategori = kategori;
      }

      const participants = await PendaftaranLakaraja.getAll(filters);
      
      // Only return necessary fields for landing page (privacy)
      const publicData = participants.map(p => ({
        id: p.id,
        nama_satuan: p.nama_satuan,
        nama_sekolah: p.nama_sekolah,
        kategori: p.kategori,
        logo_satuan: p.logo_satuan,
        created_at: p.created_at
      }));

      logger.info(`Public approved participants requested: ${publicData.length} records`);

      res.json({
        success: true,
        data: publicData
      });
    } catch (error) {
      logger.error(`Get approved participants error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data peserta'
      });
    }
  }

  // TECHNICAL MEETING ATTENDANCE FUNCTIONS

  // Get all approved participants for technical meeting (panitia only)
  static async getTechnicalMeetingParticipants(req, res) {
    try {
      const pool = require('../config/database');
      
      const query = `
        SELECT 
          p.id,
          p.nama_sekolah,
          p.nama_satuan,
          p.kategori,
          p.logo_satuan,
          u.username,
          u.no_telepon,
          CASE 
            WHEN a.id IS NOT NULL THEN 1
            ELSE 0
          END as sudah_absen,
          a.waktu_absen,
          a.foto_selfie,
          a.catatan as catatan_absen,
          panitia.username as panitia_nama
        FROM pendaftaran_lakaraja p
        INNER JOIN users_lakaraja u ON p.user_id = u.id
        LEFT JOIN absensi_technical_meeting a ON p.id = a.pendaftaran_id
        LEFT JOIN users_lakaraja panitia ON a.panitia_id = panitia.id
        WHERE p.status_pendaftaran = 'approved'
        ORDER BY p.kategori, p.nama_satuan
      `;
      
      const [participants] = await pool.query(query);

      // Add full path to logo_satuan and convert sudah_absen to boolean
      const participantsWithFullPath = participants.map(p => ({
        ...p,
        logo_satuan: p.logo_satuan ? `/uploads/lakaraja/${p.logo_satuan}` : null,
        sudah_absen: Boolean(p.sudah_absen)
      }));

      logger.info(`Technical meeting participants list requested by panitia ${req.user.id}`);

      res.json({
        success: true,
        data: participantsWithFullPath
      });
    } catch (error) {
      logger.error(`Get technical meeting participants error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data peserta technical meeting'
      });
    }
  }

  // Mark attendance for technical meeting (panitia only)
  static async markTechnicalMeetingAttendance(req, res) {
    try {
      const { pendaftaran_id, catatan, foto_selfie } = req.body;
      const panitia_id = req.user.id;
      const pool = require('../config/database');

      // Validasi input
      if (!pendaftaran_id) {
        return res.status(400).json({
          success: false,
          message: 'ID pendaftaran wajib diisi'
        });
      }

      if (!foto_selfie) {
        return res.status(400).json({
          success: false,
          message: 'Foto selfie wajib diisi'
        });
      }

      // Check if pendaftaran exists and is approved
      const [pendaftaran] = await pool.query(
        'SELECT * FROM pendaftaran_lakaraja WHERE id = ? AND status_pendaftaran = ?',
        [pendaftaran_id, 'approved']
      );

      if (pendaftaran.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pendaftaran tidak ditemukan atau belum disetujui'
        });
      }

      // Check if already attended
      const [existing] = await pool.query(
        'SELECT * FROM absensi_technical_meeting WHERE pendaftaran_id = ?',
        [pendaftaran_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Peserta sudah melakukan absensi technical meeting'
        });
      }

      // Insert attendance with foto_selfie
      const insertQuery = `
        INSERT INTO absensi_technical_meeting 
        (pendaftaran_id, panitia_id, foto_selfie, catatan) 
        VALUES (?, ?, ?, ?)
      `;
      
      await pool.query(insertQuery, [pendaftaran_id, panitia_id, foto_selfie, catatan || null]);

      logger.info(`Technical meeting attendance marked for pendaftaran ${pendaftaran_id} by panitia ${panitia_id}`);

      res.json({
        success: true,
        message: 'Absensi technical meeting berhasil dicatat'
      });
    } catch (error) {
      logger.error(`Mark technical meeting attendance error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mencatat absensi'
      });
    }
  }

  // Cancel attendance for technical meeting (panitia only)
  static async cancelTechnicalMeetingAttendance(req, res) {
    try {
      const { pendaftaran_id } = req.body;
      const pool = require('../config/database');

      // Validasi input
      if (!pendaftaran_id) {
        return res.status(400).json({
          success: false,
          message: 'ID pendaftaran wajib diisi'
        });
      }

      // Delete attendance
      const [result] = await pool.query(
        'DELETE FROM absensi_technical_meeting WHERE pendaftaran_id = ?',
        [pendaftaran_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Absensi tidak ditemukan'
        });
      }

      logger.info(`Technical meeting attendance cancelled for pendaftaran ${pendaftaran_id} by panitia ${req.user.id}`);

      res.json({
        success: true,
        message: 'Absensi technical meeting berhasil dibatalkan'
      });
    } catch (error) {
      logger.error(`Cancel technical meeting attendance error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat membatalkan absensi'
      });
    }
  }

  // Get technical meeting statistics (panitia only)
  static async getTechnicalMeetingStats(req, res) {
    try {
      const pool = require('../config/database');
      
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT p.id) as total_peserta,
          COUNT(DISTINCT a.id) as total_hadir,
          COUNT(DISTINCT CASE WHEN p.kategori = 'SD' THEN p.id END) as total_sd,
          COUNT(DISTINCT CASE WHEN p.kategori = 'SMP' THEN p.id END) as total_smp,
          COUNT(DISTINCT CASE WHEN p.kategori = 'SMA' THEN p.id END) as total_sma,
          COUNT(DISTINCT CASE WHEN p.kategori = 'SD' AND a.id IS NOT NULL THEN p.id END) as hadir_sd,
          COUNT(DISTINCT CASE WHEN p.kategori = 'SMP' AND a.id IS NOT NULL THEN p.id END) as hadir_smp,
          COUNT(DISTINCT CASE WHEN p.kategori = 'SMA' AND a.id IS NOT NULL THEN p.id END) as hadir_sma
        FROM pendaftaran_lakaraja p
        LEFT JOIN absensi_technical_meeting a ON p.id = a.pendaftaran_id
        WHERE p.status_pendaftaran = 'approved'
      `;
      
      const [stats] = await pool.query(statsQuery);

      res.json({
        success: true,
        data: stats[0]
      });
    } catch (error) {
      logger.error(`Get technical meeting stats error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil statistik technical meeting'
      });
    }
  }

  // Get kuota settings
  static async getKuotaSettings(req, res) {
    try {
      const pool = require('../config/database');
      
      const [quotas] = await pool.query(`
        SELECT 
          k.kategori,
          k.kuota,
          k.terisi,
          k.updated_at,
          u.username as updated_by_username
        FROM kuota_lakaraja k
        LEFT JOIN users_lakaraja u ON k.updated_by = u.id
        ORDER BY 
          CASE k.kategori 
            WHEN 'SD' THEN 1
            WHEN 'SMP' THEN 2
            WHEN 'SMA' THEN 3
          END
      `);

      logger.info(`Kuota settings retrieved by panitia ${req.user.id}`);

      res.json({
        success: true,
        data: quotas
      });
    } catch (error) {
      logger.error(`Get kuota settings error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data kuota'
      });
    }
  }

  // Update kuota for a specific category
  static async updateKuota(req, res) {
    try {
      const pool = require('../config/database');
      const { kategori, kuota } = req.body;

      // Validasi input
      if (!kategori || kuota === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Kategori dan kuota wajib diisi'
        });
      }

      if (!['SD', 'SMP', 'SMA'].includes(kategori)) {
        return res.status(400).json({
          success: false,
          message: 'Kategori tidak valid'
        });
      }

      if (kuota < 0) {
        return res.status(400).json({
          success: false,
          message: 'Kuota tidak boleh negatif'
        });
      }

      // Get current terisi count
      const [current] = await pool.query(
        'SELECT terisi FROM kuota_lakaraja WHERE kategori = ?',
        [kategori]
      );

      if (current.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kategori tidak ditemukan'
        });
      }

      const terisi = current[0].terisi;

      if (kuota < terisi) {
        return res.status(400).json({
          success: false,
          message: `Kuota tidak boleh kurang dari jumlah peserta yang sudah terdaftar (${terisi})`
        });
      }

      // Update kuota
      await pool.query(
        'UPDATE kuota_lakaraja SET kuota = ?, updated_by = ? WHERE kategori = ?',
        [kuota, req.user.id, kategori]
      );

      logger.info(`Kuota for ${kategori} updated to ${kuota} by panitia ${req.user.id}`);

      res.json({
        success: true,
        message: `Kuota ${kategori} berhasil diperbarui`
      });
    } catch (error) {
      logger.error(`Update kuota error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memperbarui kuota'
      });
    }
  }

  // Sync terisi count (untuk maintenance)
  static async syncKuotaTerisi(req, res) {
    try {
      const pool = require('../config/database');

      // Count approved registrations per category
      const [counts] = await pool.query(`
        SELECT 
          kategori,
          COUNT(*) as total
        FROM pendaftaran_lakaraja
        WHERE status_pendaftaran = 'approved'
        GROUP BY kategori
      `);

      // Update terisi for each category
      for (const row of counts) {
        await pool.query(
          'UPDATE kuota_lakaraja SET terisi = ? WHERE kategori = ?',
          [row.total, row.kategori]
        );
      }

      // Reset terisi to 0 for categories with no approved registrations
      await pool.query(`
        UPDATE kuota_lakaraja k
        LEFT JOIN (
          SELECT kategori, COUNT(*) as total
          FROM pendaftaran_lakaraja
          WHERE status_pendaftaran = 'approved'
          GROUP BY kategori
        ) c ON k.kategori = c.kategori
        SET k.terisi = COALESCE(c.total, 0)
      `);

      logger.info(`Kuota terisi synced by panitia ${req.user.id}`);

      res.json({
        success: true,
        message: 'Sinkronisasi kuota berhasil'
      });
    } catch (error) {
      logger.error(`Sync kuota terisi error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat sinkronisasi kuota'
      });
    }
  }

  // Get waiting list for a kategori
  static async getWaitingList(req, res) {
    try {
      const { kategori } = req.params;

      if (!['SD', 'SMP', 'SMA'].includes(kategori)) {
        return res.status(400).json({
          success: false,
          message: 'Kategori tidak valid'
        });
      }

      const waitlist = await PendaftaranLakaraja.getWaitingList(kategori);

      res.json({
        success: true,
        data: waitlist,
        count: waitlist.length
      });
    } catch (error) {
      logger.error(`Get waiting list error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil waiting list'
      });
    }
  }

  // Promote waiting list when kuota increased
  static async promoteWaitingList(req, res) {
    try {
      const { kategori } = req.params;
      const { count } = req.body; // Number of slots to promote

      if (!['SD', 'SMP', 'SMA'].includes(kategori)) {
        return res.status(400).json({
          success: false,
          message: 'Kategori tidak valid'
        });
      }

      const promoteCount = parseInt(count) || 1;

      if (promoteCount < 1) {
        return res.status(400).json({
          success: false,
          message: 'Jumlah promosi harus minimal 1'
        });
      }

      const result = await PendaftaranLakaraja.promoteWaitingList(kategori, promoteCount);

      logger.info(`Promoted ${result.promoted} from waiting list for ${kategori} by panitia ${req.user.id}`);

      res.json({
        success: true,
        message: `Berhasil mempromosikan ${result.promoted} peserta dari waiting list`,
        data: {
          promoted: result.promoted,
          promotedIds: result.promotedIds
        }
      });
    } catch (error) {
      logger.error(`Promote waiting list error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mempromosikan waiting list'
      });
    }
  }
}

module.exports = LakarajaController;
