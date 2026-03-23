const db = require('../config/database');
const crypto = require('crypto');

const RefreshToken = {
  /**
   * Hash a raw token with SHA-256.
   */
  hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  },

  /**
   * Generate a new raw refresh token (opaque).
   */
  generateRawToken() {
    return crypto.randomBytes(48).toString('hex');
  },

  /**
   * Store a refresh token hash in the database.
   */
  async create({ userId, rawToken, expiresInDays }) {
    const token_hash = this.hashToken(rawToken);
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + (expiresInDays || 7));

    const [record] = await db('refresh_tokens')
      .insert({
        user_id: userId,
        token_hash,
        expires_at,
      })
      .returning(['id', 'user_id', 'expires_at', 'created_at']);

    return record;
  },

  /**
   * Find a valid (not revoked, not expired) refresh token by raw value.
   */
  async findValid(rawToken) {
    const token_hash = this.hashToken(rawToken);
    return db('refresh_tokens')
      .where('token_hash', token_hash)
      .where('revoked', false)
      .where('expires_at', '>', new Date())
      .first();
  },

  /**
   * Revoke a refresh token by its ID.
   */
  async revoke(id) {
    return db('refresh_tokens')
      .where('id', id)
      .update({ revoked: true });
  },

  /**
   * Revoke all refresh tokens for a user.
   */
  async revokeAllForUser(userId) {
    return db('refresh_tokens')
      .where('user_id', userId)
      .where('revoked', false)
      .update({ revoked: true });
  },

  /**
   * Revoke a specific token by raw value.
   */
  async revokeByRawToken(rawToken) {
    const token_hash = this.hashToken(rawToken);
    return db('refresh_tokens')
      .where('token_hash', token_hash)
      .update({ revoked: true });
  },
};

module.exports = RefreshToken;
