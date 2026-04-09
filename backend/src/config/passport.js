/**
 * Passport.js Google OAuth 2.0 Strategy Configuration (T-120, Sprint 27)
 *
 * Configures passport-google-oauth20 strategy. Gracefully degrades when
 * GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET are not set — the strategy
 * is simply not registered, and the route handler checks for this.
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Whether Google OAuth is configured (both env vars present).
 */
function isGoogleOAuthConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Initialize Passport with Google Strategy if credentials are available.
 * Returns the passport instance (for use as middleware).
 */
function initializePassport() {
  if (!isGoogleOAuthConfigured()) {
    // No Google credentials — skip strategy registration.
    // Routes will check isGoogleOAuthConfigured() and degrade gracefully.
    return passport;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback';

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          const displayName =
            profile.displayName ||
            [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
            (email ? email.split('@')[0] : 'User');

          if (!email) {
            return done(new Error('No email returned from Google profile'), null);
          }

          // 1. Look up by google_id (returning Google user)
          let user = await User.findByGoogleId(googleId);
          if (user) {
            // Update updated_at timestamp
            await User.updateTimestamp(user.id);
            return done(null, { ...user, _oauthAction: 'returning' });
          }

          // 2. Look up by email (account-linking case)
          user = await User.findByEmail(email);
          if (user) {
            // Link Google ID to existing account
            await User.linkGoogleId(user.id, googleId);
            return done(null, { ...user, _oauthAction: 'linked' });
          }

          // 3. Create new Google-only user
          user = await User.createGoogleUser({
            full_name: displayName,
            email: email.toLowerCase().trim(),
            google_id: googleId,
          });
          return done(null, { ...user, _oauthAction: 'new' });
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // We don't use Passport sessions (we use JWT), so serialize/deserialize are no-ops
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => done(null, { id }));

  return passport;
}

module.exports = { initializePassport, isGoogleOAuthConfigured };
