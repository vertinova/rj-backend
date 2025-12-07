const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const TarunaController = require('../controllers/tarunaController');
const { authMiddleware, isTaruna } = require('../middleware/authMiddleware');
const { uploadPendaftaran, uploadAbsensi } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');

// Validation rules
const pendaftaranValidation = [
  body('nama_lengkap').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('alamat').trim().notEmpty().withMessage('Alamat wajib diisi'),
  body('tempat_lahir').trim().notEmpty().withMessage('Tempat lahir wajib diisi'),
  body('tanggal_lahir').isDate().withMessage('Tanggal lahir tidak valid'),
  body('jenis_kelamin').isIn(['L', 'P']).withMessage('Jenis kelamin tidak valid'),
  body('tinggi_badan').isNumeric().withMessage('Tinggi badan harus angka'),
  body('berat_badan').isNumeric().withMessage('Berat badan harus angka'),
  body('kelas').trim().notEmpty().withMessage('Kelas wajib diisi'),
  body('nama_orangtua').trim().notEmpty().withMessage('Nama orang tua wajib diisi'),
  body('nomor_whatsapp').trim().notEmpty().withMessage('Nomor WhatsApp wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('alasan').trim().notEmpty().withMessage('Alasan wajib diisi'),
  body('pendidikan_terakhir').trim().notEmpty().withMessage('Pendidikan terakhir wajib diisi'),
  body('pilihan_kampus').trim().notEmpty().withMessage('Pilihan kampus wajib diisi')
];

const absensiValidation = [
  body('tanggal_absensi').isDate().withMessage('Tanggal absensi tidak valid'),
  body('keterangan').optional().trim()
];

// Routes
router.post(
  '/pendaftaran',
  authMiddleware,
  isTaruna,
  uploadPendaftaran,
  pendaftaranValidation,
  validate,
  TarunaController.submitPendaftaran
);

router.get(
  '/pendaftaran/status',
  authMiddleware,
  isTaruna,
  TarunaController.getPendaftaranStatus
);

router.get(
  '/profile/check-completeness',
  authMiddleware,
  isTaruna,
  TarunaController.checkProfileCompleteness
);

router.put(
  '/profile',
  authMiddleware,
  isTaruna,
  uploadPendaftaran,
  TarunaController.updateProfile
);

router.post(
  '/absensi',
  authMiddleware,
  isTaruna,
  uploadAbsensi.single('foto_absensi'),
  absensiValidation,
  validate,
  TarunaController.submitAbsensi
);

router.get(
  '/absensi/history',
  authMiddleware,
  isTaruna,
  TarunaController.getAbsensiHistory
);

module.exports = router;
