const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const User = {
  /**
   * Create a new user with hashed password.
   */
  async create({ full_name, email, password }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db('users')
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        password_hash,
      })
      .returning(['id', 'full_name', 'email', 'created_at']);
    return user;
  },

  /**
   * Find a user by email (case-insensitive).
   */
  async findByEmail(email) {
    return db('users')
      .where('email', email.toLowerCase().trim())
      .first();
  },

  /**
   * Find a user by ID.
   */
  async findById(id) {
    return db('users')
      .select('id', 'full_name', 'email', 'created_at')
      .where('id', id)
      .first();
  },

  /**
   * Verify password against stored hash.
   */
  async verifyPassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  },
};

module.exports = User;
