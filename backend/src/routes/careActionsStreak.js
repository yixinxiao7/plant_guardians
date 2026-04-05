/**
 * Care Action Streak route (T-090)
 *
 * GET /api/v1/care-actions/streak — returns currentStreak, longestStreak,
 * lastActionDate for the authenticated user.
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const CareAction = require('../models/CareAction');
const { ValidationError } = require('../utils/errors');

router.use(authenticate);

// GET /api/v1/care-actions/streak
router.get('/', async (req, res, next) => {
  try {
    // Validate optional utcOffset query parameter
    let utcOffset = 0;
    if (req.query.utcOffset !== undefined) {
      const raw = req.query.utcOffset;
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed < -840 || parsed > 840) {
        throw new ValidationError('utcOffset must be an integer between -840 and 840');
      }
      utcOffset = parsed;
    }

    const streak = await CareAction.getStreakByUser(req.user.id, utcOffset);

    res.status(200).json({
      data: streak,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
