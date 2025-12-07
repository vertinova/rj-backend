const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

// All routes require admin authentication
router.use(authMiddleware, isAdmin);

// Dashboard Statistics
router.get('/statistics', adminController.getStatistics);

// Pendaftar management
router.get('/pendaftar', adminController.getPendaftar);
router.put(
  '/pendaftar/:id/status',
  [body('status').isIn(['pending', 'lolos', 'tidak lolos']).withMessage('Status tidak valid')],
  validate,
  adminController.updatePendaftarStatus
);

// User management
router.get('/users', adminController.getUsers);
router.put(
  '/users/:id/reset-password',
  [body('newPassword').isLength({ min: 6 }).withMessage('Password minimal 6 karakter')],
  validate,
  adminController.resetUserPassword
);

// Absensi
router.get('/absensi', adminController.getAbsensi);

// Generate KTA
router.post('/generate-kta', 
  [body('pendaftarId').isInt().withMessage('ID pendaftar tidak valid')],
  validate,
  adminController.generateKTA
);

module.exports = router;
