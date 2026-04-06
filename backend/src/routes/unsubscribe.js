/**
 * Unsubscribe route (T-101, Sprint 22)
 *
 * GET /api/v1/unsubscribe?token=<hmac>&uid=<userId>
 * Public endpoint — no Bearer token required.
 * Verifies the HMAC-signed token and sets opt_in = false.
 */
const express = require('express');
const router = express.Router();
const { AppError, ValidationError, NotFoundError } = require('../utils/errors');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');
const emailService = require('../services/EmailService');

// GET /unsubscribe?token=<hmac>&uid=<userId>
router.get('/', async (req, res, next) => {
  try {
    const { token, uid } = req.query;

    if (!token || !uid) {
      throw new AppError('Missing or invalid unsubscribe token.', 400, 'INVALID_TOKEN');
    }

    // Verify HMAC
    const valid = emailService.verifyUnsubscribeToken(token, uid);
    if (!valid) {
      throw new AppError('Invalid or expired unsubscribe token.', 400, 'INVALID_TOKEN');
    }

    // Check user exists
    const user = await User.findById(uid);
    if (!user) {
      throw new NotFoundError('User', 'USER_NOT_FOUND');
    }

    // Unsubscribe
    await NotificationPreference.unsubscribe(uid);

    res.status(200).json({
      data: {
        message: 'You have been unsubscribed from Plant Guardians care reminder emails.',
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
