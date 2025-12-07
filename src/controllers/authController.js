const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Check if username already exists
      if (await User.usernameExists(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah terdaftar'
        });
      }

      // Check if email already exists
      if (await User.emailExists(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userId = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });

      logger.info(`New user registered: ${username} (ID: ${userId})`);

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil! Silakan login.',
        data: { userId }
      });
    } catch (error) {
      logger.error(`Register error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat registrasi'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await User.findByUsername(username);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
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
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      logger.info(`User logged in: ${username} (ID: ${user.id})`);

      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat login'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error(`Get profile error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil profil'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password
      const user = await User.findById(userId);
      const userWithPassword = await User.findByUsername(user.username);

      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, userWithPassword.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password lama salah'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await User.updatePassword(userId, hashedPassword);

      logger.info(`Password changed for user ID: ${userId}`);

      res.json({
        success: true,
        message: 'Password berhasil diubah'
      });
    } catch (error) {
      logger.error(`Change password error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengubah password'
      });
    }
  }
}

module.exports = AuthController;
