const { AppError } = require('../utils/errors');

/**
 * Centralized error handler middleware.
 * Routes throw errors; this middleware catches them and sends structured JSON.
 */
function errorHandler(err, req, res, _next) {
  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        message: `File exceeds the maximum upload size of ${process.env.MAX_UPLOAD_SIZE_MB || 5} MB.`,
        code: 'FILE_TOO_LARGE',
      },
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Unknown errors — log but never leak details
  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: {
      message: 'An unexpected error occurred.',
      code: 'INTERNAL_ERROR',
    },
  });
}

module.exports = errorHandler;
