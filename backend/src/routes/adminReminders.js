/**
 * Admin Trigger Reminders route (T-101, Sprint 22)
 *
 * POST /api/v1/admin/trigger-reminders
 * Dev/test only — manually triggers the care reminder cron job.
 * NOT registered in production (NODE_ENV === 'production').
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { ValidationError, ForbiddenError } = require('../utils/errors');
const ReminderService = require('../services/ReminderService');

router.use(authenticate);

// POST /trigger-reminders
router.post('/', async (req, res, next) => {
  try {
    // Double-check production guard (belt + suspenders — route should not be registered in prod)
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenError('This endpoint is not available in production.');
    }

    let hourUtc;
    if (req.body.hour_utc !== undefined) {
      hourUtc = req.body.hour_utc;
      if (!Number.isInteger(hourUtc) || hourUtc < 0 || hourUtc > 23) {
        throw new ValidationError('hour_utc must be an integer between 0 and 23.');
      }
    } else {
      hourUtc = new Date().getUTCHours();
    }

    const result = await ReminderService.runForHour(hourUtc);

    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
