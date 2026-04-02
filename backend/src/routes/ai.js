/**
 * AI routes — Sprint 17 (T-077, T-078)
 *
 * POST /api/v1/ai/advice   — text-based care advice (plant name → structured recommendations)
 * POST /api/v1/ai/identify — image-based plant identification (photo → ID + recommendations)
 *
 * Both endpoints return the same response shape (Sprint 17 contract).
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { ValidationError, ExternalServiceError } = require('../utils/errors');
const GeminiService = require('../services/GeminiService');

router.use(authenticate);

// --- Multer config for /identify (memory storage, no disk writes) ---
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new ValidationError('Image must be JPEG, PNG, or WebP.'));
    }
    cb(null, true);
  },
});

/**
 * Create a GeminiService instance, validating the API key is configured.
 * @throws {ExternalServiceError} If GEMINI_API_KEY is missing or placeholder
 */
function createGeminiService() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    throw new ExternalServiceError(
      'AI advice is temporarily unavailable. Please try again.',
      'EXTERNAL_SERVICE_ERROR'
    );
  }
  return new GeminiService(apiKey);
}

// POST /api/v1/ai/advice (T-077)
router.post('/advice', async (req, res, next) => {
  try {
    const { plant_type } = req.body;

    // Validation: plant_type required, non-empty, max 200 chars
    if (!plant_type || (typeof plant_type === 'string' && plant_type.trim() === '')) {
      throw new ValidationError('plant_type is required.');
    }

    if (typeof plant_type !== 'string') {
      throw new ValidationError('plant_type is required.');
    }

    if (plant_type.length > 200) {
      throw new ValidationError('plant_type must be 200 characters or fewer.');
    }

    const service = createGeminiService();
    const result = await service.getAdvice(plant_type);

    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/identify (T-078)
router.post('/identify', (req, res, next) => {
  memoryUpload.single('image')(req, res, async (uploadErr) => {
    try {
      // Handle multer errors
      if (uploadErr) {
        if (uploadErr.code === 'LIMIT_FILE_SIZE') {
          throw new ValidationError('Image must be 5MB or smaller.');
        }
        if (uploadErr instanceof ValidationError) {
          throw uploadErr;
        }
        throw uploadErr;
      }

      // Validate image was provided
      if (!req.file) {
        throw new ValidationError('An image is required.');
      }

      const service = createGeminiService();
      const result = await service.identifyFromImage(req.file.buffer, req.file.mimetype);

      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  });
});

module.exports = router;
