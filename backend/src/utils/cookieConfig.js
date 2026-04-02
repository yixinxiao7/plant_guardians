/**
 * Shared cookie configuration for refresh tokens.
 *
 * When frontend and backend are on different origins (e.g., Render's separate
 * subdomains), sameSite must be 'none' so the browser sends the cookie
 * cross-origin. When they're on the same origin (reverse proxy setup),
 * 'strict' is more secure.
 *
 * Control via COOKIE_SAME_SITE env var. Defaults:
 *   - production with RENDER=true  → 'none'  (cross-origin)
 *   - production without RENDER    → 'strict' (same-origin reverse proxy)
 *   - development                  → 'lax'
 */

const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER === 'true';

function getSameSite() {
  if (process.env.COOKIE_SAME_SITE) {
    return process.env.COOKIE_SAME_SITE.toLowerCase();
  }
  if (isProduction && isRender) return 'none';
  if (isProduction) return 'strict';
  return 'lax';
}

const sameSite = getSameSite();

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction || sameSite === 'none', // secure is required when sameSite=none
  sameSite,
  path: '/api/v1/auth',
};

/**
 * Set the refresh token as an HttpOnly cookie on the response.
 */
function setRefreshTokenCookie(res, rawToken) {
  const expiresInDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);
  const maxAgeMs = expiresInDays * 86400 * 1000;

  res.cookie('refresh_token', rawToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: maxAgeMs,
  });
}

/**
 * Clear the refresh token cookie.
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
}

module.exports = { setRefreshTokenCookie, clearRefreshTokenCookie };
