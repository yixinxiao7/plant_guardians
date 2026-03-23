/**
 * Custom application errors with HTTP status codes and error codes.
 * Routes throw these; the centralized error handler catches them.
 */

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }
}

class InvalidRefreshTokenError extends AppError {
  constructor() {
    super('Refresh token is invalid, expired, or already used.', 401, 'INVALID_REFRESH_TOKEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource, code) {
    super(`${resource} not found.`, 404, code || 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message, code) {
    super(message, 409, code || 'CONFLICT');
  }
}

class UnprocessableError extends AppError {
  constructor(message, code) {
    super(message, 422, code || 'UNPROCESSABLE');
  }
}

class ExternalServiceError extends AppError {
  constructor(message, code) {
    super(message, 502, code || 'EXTERNAL_SERVICE_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  NotFoundError,
  ConflictError,
  UnprocessableError,
  ExternalServiceError,
};
