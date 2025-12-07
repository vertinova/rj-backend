const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username minimal 3 karakter')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username hanya boleh mengandung huruf, angka, dan underscore'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email tidak valid')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter'),
  body('confirm_password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password tidak cocok')
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi')
];

const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Password lama wajib diisi'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password baru minimal 6 karakter'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Konfirmasi password tidak cocok')
];

// Routes
router.post('/register', registerLimiter, registerValidation, validate, AuthController.register);
router.post('/login', loginLimiter, loginValidation, validate, AuthController.login);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/change-password', authMiddleware, changePasswordValidation, validate, AuthController.changePassword);

module.exports = router;
