/**
 * Notification Preferences routes (T-101, Sprint 22)
 *
 * GET  /api/v1/profile/notification-preferences — get current preferences
 * POST /api/v1/profile/notification-preferences — update preferences (upsert)
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { ValidationError } = require('../utils/errors');
const NotificationPreference = require('../models/NotificationPreference');

router.use(authenticate);

// GET /notification-preferences
router.get('/', async (req, res, next) => {
  try {
    const pref = await NotificationPreference.findOrCreate(req.user.id);
    res.status(200).json({
      data: {
        opt_in: pref.opt_in,
        reminder_hour_utc: pref.reminder_hour_utc,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /notification-preferences
router.post('/', async (req, res, next) => {
  try {
    const { opt_in, reminder_hour_utc } = req.body;

    // At least one field must be provided
    if (opt_in === undefined && reminder_hour_utc === undefined) {
      throw new ValidationError('At least one of opt_in or reminder_hour_utc must be provided.');
    }

    // Validate opt_in
    if (opt_in !== undefined && typeof opt_in !== 'boolean') {
      throw new ValidationError('opt_in must be a boolean.');
    }

    // Validate reminder_hour_utc
    if (reminder_hour_utc !== undefined) {
      if (!Number.isInteger(reminder_hour_utc) || reminder_hour_utc < 0 || reminder_hour_utc > 23) {
        throw new ValidationError('reminder_hour_utc must be an integer between 0 and 23.');
      }
    }

    const updates = {};
    if (opt_in !== undefined) updates.opt_in = opt_in;
    if (reminder_hour_utc !== undefined) updates.reminder_hour_utc = reminder_hour_utc;

    const pref = await NotificationPreference.upsert(req.user.id, updates);
    res.status(200).json({
      data: {
        opt_in: pref.opt_in,
        reminder_hour_utc: pref.reminder_hour_utc,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
