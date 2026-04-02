const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const {
  ValidationError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  ConflictError,
} = require('../utils/errors');
const { setRefreshTokenCookie, clearRefreshTokenCookie } = require('../utils/cookieConfig');

/**
 * Generate a JWT access token.
 */
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

/**
 * Generate and store a refresh token.
 */
async function generateRefreshToken(userId) {
  const rawToken = RefreshToken.generateRawToken();
  const expiresInDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);
  await RefreshToken.create({ userId, rawToken, expiresInDays });
  return rawToken;
}

// POST /api/v1/auth/register
router.post(
  '/register',
  validateBody([
    { field: 'full_name', required: true, type: 'string', min: 2, max: 100 },
    { field: 'email', required: true, type: 'string', email: true },
    { field: 'password', required: true, type: 'string', min: 8 },
  ]),
  async (req, res, next) => {
    try {
      const { full_name, email, password } = req.body;

      // Check for existing user
      const existing = await User.findByEmail(email);
      if (existing) {
        throw new ConflictError('An account with that email already exists.', 'EMAIL_ALREADY_EXISTS');
      }

      const user = await User.create({ full_name, email, password });
      const access_token = generateAccessToken(user);
      const refresh_token = await generateRefreshToken(user.id);

      // Set refresh token as HttpOnly cookie (T-053)
      setRefreshTokenCookie(res, refresh_token);

      res.status(201).json({
        data: {
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            created_at: user.created_at,
          },
          access_token,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  validateBody([
    { field: 'email', required: true, type: 'string' },
    { field: 'password', required: true, type: 'string' },
  ]),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      const valid = await User.verifyPassword(password, user.password_hash);
      if (!valid) {
        throw new InvalidCredentialsError();
      }

      const access_token = generateAccessToken(user);
      const refresh_token = await generateRefreshToken(user.id);

      // Set refresh token as HttpOnly cookie (T-053)
      setRefreshTokenCookie(res, refresh_token);

      res.status(200).json({
        data: {
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            created_at: user.created_at,
          },
          access_token,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/refresh
// Refresh token is read from the HttpOnly cookie (T-053)
router.post(
  '/refresh',
  async (req, res, next) => {
    try {
      const rawToken = req.cookies && req.cookies.refresh_token;
      if (!rawToken) {
        throw new InvalidRefreshTokenError();
      }

      const tokenRecord = await RefreshToken.findValid(rawToken);
      if (!tokenRecord) {
        throw new InvalidRefreshTokenError();
      }

      // Revoke the old token (rotation)
      await RefreshToken.revoke(tokenRecord.id);

      // Generate new tokens
      const user = await User.findById(tokenRecord.user_id);
      if (!user) {
        throw new InvalidRefreshTokenError();
      }

      const access_token = generateAccessToken(user);
      const new_refresh_token = await generateRefreshToken(user.id);

      // Set rotated refresh token as HttpOnly cookie (T-053)
      setRefreshTokenCookie(res, new_refresh_token);

      res.status(200).json({
        data: {
          access_token,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/logout
// Refresh token is read from the HttpOnly cookie (T-053)
router.post(
  '/logout',
  authenticate,
  async (req, res, next) => {
    try {
      const rawToken = req.cookies && req.cookies.refresh_token;
      if (rawToken) {
        await RefreshToken.revokeByRawToken(rawToken);
      }

      // Clear the refresh token cookie (T-053)
      clearRefreshTokenCookie(res);

      res.status(200).json({
        data: {
          message: 'Logged out successfully.',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/auth/account (T-033)
router.delete(
  '/account',
  authenticate,
  async (req, res, next) => {
    try {
      // 1. Collect photo URLs before deleting DB rows (for file cleanup)
      const photoUrls = await User.findPhotoUrlsByUserId(req.user.id);

      // 2. Delete user — ON DELETE CASCADE removes refresh_tokens, plants,
      //    care_schedules (via plants), and care_actions (via plants)
      const deleted = await User.deleteById(req.user.id);
      if (!deleted) {
        // User not found (already deleted or race condition) — still return 204
        return res.status(204).end();
      }

      // 3. Best-effort cleanup of uploaded photo files
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      for (const url of photoUrls) {
        try {
          // photo_url is stored as "/uploads/filename.ext"
          const filename = url.split('/').pop();
          if (filename) {
            const filePath = path.resolve(uploadDir, filename);
            fs.unlinkSync(filePath);
          }
        } catch {
          // File may already be missing — non-critical, continue
        }
      }

      // Clear the refresh token cookie on account deletion (T-053)
      clearRefreshTokenCookie(res);

      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
