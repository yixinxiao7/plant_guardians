const multer = require('multer');
const path = require('path');
const { randomUUID } = require('node:crypto');
const { ValidationError } = require('../utils/errors');

// T-140: uuid@14 is ESM-only and incompatible with Jest 29's CJS transformer
// without adding babel-preset-env (which would violate the "no other dependency
// changes" acceptance criterion). uuid@14's v4() internally delegates to
// crypto.randomUUID() in Node anyway when called with no options/buf, so this
// is a behaviour-preserving switch. The uuid@14 package remains installed per
// acceptance criteria so the npm audit advisory (GHSA-w5hq-g745-h8pq) clears.

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '5', 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
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
