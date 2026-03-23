const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Authentication middleware.
 * Extracts and verifies JWT from Authorization: Bearer <token> header.
 * Sets req.user = { id, email } on success.
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Missing access token.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return next(err);
    }
    // JWT verification errors (expired, malformed, etc.)
    return next(new UnauthorizedError('Invalid or expired access token.'));
  }
}

module.exports = { authenticate };
