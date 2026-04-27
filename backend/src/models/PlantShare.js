const crypto = require('crypto');
const db = require('../config/database');

const PlantShare = {
  /**
   * Generate a URL-safe share token.
   * 32 random bytes encoded as base64url → 43 chars, 256-bit entropy,
   * no padding, uses only [A-Z a-z 0-9 - _].
   */
  generateToken() {
    return crypto.randomBytes(32).toString('base64url');
  },

  /**
   * Find an existing share row for a plant (idempotency check).
   */
  async findByPlantId(plantId) {
    return db('plant_shares').where({ plant_id: plantId }).first();
  },

  /**
   * Find a share row by its public token.
   * Used by the no-auth public endpoint.
   */
  async findByToken(shareToken) {
    return db('plant_shares').where({ share_token: shareToken }).first();
  },

  /**
   * Create a new share row for a plant. Returns the inserted row.
   * Caller is responsible for ensuring no row exists yet (idempotency
   * check happens in the route handler).
   */
  async create({ plantId, userId, shareToken }) {
    const [row] = await db('plant_shares')
      .insert({
        plant_id: plantId,
        user_id: userId,
        share_token: shareToken,
      })
      .returning('*');
    return row;
  },

  /**
   * Delete the share row for a plant (T-133 revocation endpoint).
   * Returns the number of rows deleted (0 if no share exists, 1 otherwise).
   * Callers should map a result of 0 to a 404 NOT_FOUND response.
   */
  async deleteByPlantId(plantId) {
    return db('plant_shares').where({ plant_id: plantId }).del();
  },
};

module.exports = PlantShare;
