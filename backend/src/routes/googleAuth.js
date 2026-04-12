/**
 * Google OAuth 2.0 Routes (T-120, Sprint 27)
 *
 * GET /api/v1/auth/google          — Initiates OAuth redirect to Google
 * GET /api/v1/auth/google/callback — Handles callback, upserts user, redirects with tokens
 *
 * Both are browser-navigation endpoints (302 redirects, not JSON APIs).
 * Token delivery: query params on the frontend redirect URL.
 */

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const RefreshToken = require('../models/RefreshToken');
const { isGoogleOAuthConfigured } = require('../config/passport');
const { setRefreshTokenCookie } = require('../utils/cookieConfig');

const FRONTEND_URL = () => {
  // Use first origin from FRONTEND_URL (comma-separated list) as the redirect target
  const urls = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
  return urls[0].trim();
};

/**
 * Generate a JWT access token (same logic as email/password auth).
 */
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

/**
 * Generate and store a refresh token (same logic as email/password auth).
 */
async function generateRefreshToken(userId) {
  const rawToken = RefreshToken.generateRawToken();
  const expiresInDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);
  await RefreshToken.create({ userId, rawToken, expiresInDays });
  return rawToken;
}

// GET /api/v1/auth/google — Initiate OAuth flow
router.get('/google', (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    // Graceful degradation — redirect to login with error
    return res.redirect(`${FRONTEND_URL()}/login?error=oauth_failed`);
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
});

// GET /api/v1/auth/google/callback — Handle OAuth callback
router.get('/google/callback', (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.redirect(`${FRONTEND_URL()}/login?error=oauth_failed`);
  }

  // Check if user cancelled on Google's consent screen
  if (req.query.error === 'access_denied') {
    return res.redirect(`${FRONTEND_URL()}/login?error=access_denied`);
  }

  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND_URL()}/login?error=oauth_failed`,
  }, async (err, user) => {
    try {
      if (err || !user) {
        return res.redirect(`${FRONTEND_URL()}/login?error=oauth_failed`);
      }

      // Issue tokens (same as email/password login)
      const access_token = generateAccessToken(user);
      const refresh_token = await generateRefreshToken(user.id);

      // Set refresh token as HttpOnly cookie (same as email/password login)
      setRefreshTokenCookie(res, refresh_token);

      // Build redirect URL with access token as query param
      // refresh_token is delivered via cookie; no need to expose it in the URL
      let redirectUrl = `${FRONTEND_URL()}/?access_token=${encodeURIComponent(access_token)}`;

      // Signal account-linking to frontend
      if (user._oauthAction === 'linked') {
        redirectUrl += '&linked=true';
      }

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.redirect(`${FRONTEND_URL()}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

module.exports = router;
