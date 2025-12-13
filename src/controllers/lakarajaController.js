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

      // Create registration
      const regId = await PendaftaranLakaraja.create({
        user_id: userId,
        nama_sekolah,
        nama_satuan,
        kategori,
        logo_satuan,
        bukti_payment
      });

      logger.info(`New Lakaraja registration: User ID ${userId}, Reg ID ${regId}`);

      res.status(201).json({
        success: true,
        message: 'Pendaftaran berhasil! Menunggu verifikasi panitia.',
        data: { registrationId: regId }
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

  // Get statistics (panitia only)
  static async getStatistics(req, res) {
    try {
      const stats = await UserLakaraja.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Get Lakaraja statistics error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil statistik'
      });
    }
  }
}

module.exports = LakarajaController;
