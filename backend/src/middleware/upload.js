const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('../utils/errors');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '5', 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ValidationError(
      `Invalid file type. Allowed types: JPEG, PNG, WebP.`
    ));
  }
  cb(null, true);
};

// Set custom error code for file filter rejections
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
  },
});

module.exports = upload;
