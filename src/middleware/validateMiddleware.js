const { validationResult } = require('express-validator');

// Middleware to validate request data
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Validate Lakaraja Registration
const validateLakarajaRegistration = (req, res, next) => {
  const { username, password, no_telepon } = req.body;

  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username harus diisi' });
  } else if (username.length < 3) {
    errors.push({ field: 'username', message: 'Username minimal 3 karakter' });
  }

  if (!password || password.length < 6) {
    errors.push({ field: 'password', message: 'Password minimal 6 karakter' });
  }

  if (!no_telepon || no_telepon.trim().length === 0) {
    errors.push({ field: 'no_telepon', message: 'Nomor telepon harus diisi' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors
    });
  }

  next();
};

module.exports = {
  validate,
  validateLakarajaRegistration
};

