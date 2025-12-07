const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage for different types of uploads
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads', destination);
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
};

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, JPEG, PNG) yang diperbolehkan!'));
  }
};

// File filter for documents (images and PDFs)
const documentFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /jpeg|jpg|png|application\/pdf/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, JPEG, PNG) atau PDF yang diperbolehkan!'));
  }
};

// Upload configurations
const uploadPhoto = multer({
  storage: createStorage('photos'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFilter
});

const uploadDocument = multer({
  storage: createStorage('documents'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: documentFilter
});

const uploadAbsensi = multer({
  storage: createStorage('absensi'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFilter
});

// Multiple file upload for pendaftaran
const uploadPendaftaran = multer({
  storage: createStorage('documents'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: documentFilter
}).fields([
  { name: 'foto_diri', maxCount: 1 },
  { name: 'surat_izin_orangtua', maxCount: 1 },
  { name: 'surat_keterangan_sehat', maxCount: 1 }
]);

module.exports = {
  uploadPhoto,
  uploadDocument,
  uploadAbsensi,
  uploadPendaftaran
};
