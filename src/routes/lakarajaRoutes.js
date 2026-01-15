const express = require('express');
const router = express.Router();
const LakarajaController = require('../controllers/lakarajaController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const { validateLakarajaRegistration } = require('../middleware/validateMiddleware');
const { uploadLakaraja } = require('../middleware/uploadMiddleware');

// Middleware to check if user is panitia lakaraja
const isPanitiaLakaraja = (req, res, next) => {
  if (req.user && req.user.lakaraja_role === 'panitia') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya panitia yang dapat mengakses.'
    });
  }
};

// Public routes
router.post('/register', validateLakarajaRegistration, LakarajaController.register);
router.post('/login', LakarajaController.login);
router.get('/kuota', LakarajaController.getKuotaInfo);
router.get('/kuota/check', LakarajaController.checkKuotaAvailability);
router.get('/participants', LakarajaController.getApprovedParticipants); // Public endpoint for landing page

// Protected routes - Peserta Lakaraja
router.get('/profile', authMiddleware, LakarajaController.getProfile);
router.put('/profile', authMiddleware, LakarajaController.updateProfile);

// Registration routes - Peserta
router.get('/pendaftaran/:userId', LakarajaController.getRegistration);

router.post('/pendaftaran', 
  authMiddleware, 
  uploadLakaraja.fields([
    { name: 'logo_satuan', maxCount: 1 },
    { name: 'bukti_payment', maxCount: 1 }
  ]), 
  LakarajaController.submitRegistration
);

router.put('/pendaftaran', 
  authMiddleware, 
  uploadLakaraja.fields([
    { name: 'logo_satuan', maxCount: 1 },
    { name: 'bukti_payment', maxCount: 1 }
  ]), 
  LakarajaController.updateRegistration
);

// Team data submission (daftar ulang)
router.post('/pendaftaran/team',
  authMiddleware,
  uploadLakaraja.fields([
    { name: 'surat_keterangan', maxCount: 1 },
    { name: 'foto_team', maxCount: 1 },
    { name: 'foto_anggota', maxCount: 30 } // max 30 members
  ]),
  LakarajaController.submitTeamData
);

// Panitia routes
router.get('/panitia/users', authMiddleware, isPanitiaLakaraja, LakarajaController.getAllUsers);
router.get('/panitia/registrations', authMiddleware, isPanitiaLakaraja, LakarajaController.getAllRegistrations);
router.put('/panitia/registration/:id/status', authMiddleware, isPanitiaLakaraja, LakarajaController.updateRegistrationStatus);
router.delete('/panitia/:id', authMiddleware, isPanitiaLakaraja, LakarajaController.deleteRegistration);
router.delete('/panitia/team/:id', authMiddleware, isPanitiaLakaraja, LakarajaController.resetTeamData);
router.put('/panitia/user/:id/reset-password', authMiddleware, isPanitiaLakaraja, LakarajaController.resetUserPassword);
router.put('/panitia/user/:id/toggle-active', authMiddleware, isPanitiaLakaraja, LakarajaController.toggleUserActive);
router.delete('/panitia/user/:id', authMiddleware, isPanitiaLakaraja, LakarajaController.deleteUser);
router.get('/panitia/statistics', authMiddleware, isPanitiaLakaraja, LakarajaController.getStatistics);

// Technical Meeting routes (Panitia only)
router.get('/panitia/technical-meeting/participants', authMiddleware, isPanitiaLakaraja, LakarajaController.getTechnicalMeetingParticipants);
router.post('/panitia/technical-meeting/attendance', authMiddleware, isPanitiaLakaraja, LakarajaController.markTechnicalMeetingAttendance);
router.delete('/panitia/technical-meeting/attendance', authMiddleware, isPanitiaLakaraja, LakarajaController.cancelTechnicalMeetingAttendance);
router.get('/panitia/technical-meeting/stats', authMiddleware, isPanitiaLakaraja, LakarajaController.getTechnicalMeetingStats);

// Admin can also access panitia routes
router.get('/admin/users', authMiddleware, isAdmin, LakarajaController.getAllUsers);
router.get('/admin/registrations', authMiddleware, isAdmin, LakarajaController.getAllRegistrations);
router.put('/admin/registration/:id/status', authMiddleware, isAdmin, LakarajaController.updateRegistrationStatus);
router.delete('/admin/:id', authMiddleware, isAdmin, LakarajaController.deleteRegistration);
router.put('/admin/user/:id/reset-password', authMiddleware, isAdmin, LakarajaController.resetUserPassword);
router.put('/admin/user/:id/toggle-active', authMiddleware, isAdmin, LakarajaController.toggleUserActive);
router.delete('/admin/user/:id', authMiddleware, isAdmin, LakarajaController.deleteUser);
router.get('/admin/statistics', authMiddleware, isAdmin, LakarajaController.getStatistics);

module.exports = router;
