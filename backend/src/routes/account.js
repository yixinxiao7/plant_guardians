/**
 * Account management routes (T-069)
 *
 * DELETE /api/v1/account — permanently delete the authenticated user's account
 * and all associated data. Requires password confirmation.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const User = require('../models/User');
const { AppError } = require('../utils/errors');

/**
 * Clear the refresh token cookie (same attributes as auth.js).
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

// All routes require authentication
router.use(authenticate);

// DELETE /api/v1/account
router.delete(
  '/',
  validateBody([
    { field: 'password', required: true, type: 'string' },
  ]),
  async (req, res, next) => {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      // Fetch full user record (includes password_hash)
      const user = await User.findByEmail(req.user.email);
      if (!user) {
        // User not found — already deleted or race condition; return 204 anyway
        clearRefreshTokenCookie(res);
        return res.status(204).send();
      }

      // Verify password
      const valid = await User.verifyPassword(password, user.password_hash);
      if (!valid) {
        throw new AppError('Password is incorrect.', 400, 'INVALID_PASSWORD');
      }

      // Collect photo URLs before cascade delete (for file cleanup)
      const photoUrls = await User.findPhotoUrlsByUserId(userId);

      // Delete user — ON DELETE CASCADE removes all associated data
      await User.deleteById(userId);

      // Best-effort cleanup of uploaded photo files
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      for (const url of photoUrls) {
        try {
          const filename = url.split('/').pop();
          if (filename) {
            const filePath = path.resolve(uploadDir, filename);
            fs.unlinkSync(filePath);
          }
        } catch {
          // File may already be missing — non-critical, continue
        }
      }

      // Clear the refresh token cookie
      clearRefreshTokenCookie(res);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
