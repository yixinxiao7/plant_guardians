/**
 * Care Action Stats route (T-064)
 *
 * GET /api/v1/care-actions/stats — aggregated care action statistics
 * for the authenticated user's plants.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const CareAction = require('../models/CareAction');

// T-071: Endpoint-specific rate limiter — 30 requests per 15-minute window per IP
const statsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many requests.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

router.use(authenticate);

// GET /api/v1/care-actions/stats
router.get('/', statsRateLimiter, async (req, res, next) => {
  try {
    const stats = await CareAction.getStatsByUser(req.user.id);

    res.status(200).json({
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
