const { ValidationError } = require('../utils/errors');

/**
 * Validates that a string is a valid email format (basic RFC check).
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validates that a string is a valid UUID v4.
 */
function isValidUUID(str) {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return re.test(str);
}

/**
 * Validates that a string is a valid ISO 8601 datetime.
 */
function isValidISO8601(str) {
  const d = new Date(str);
  return !isNaN(d.getTime());
}

/**
 * Middleware factory: validates request body fields.
 * rules is an array of { field, required, type, min, max, enum, custom }
 */
function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const rule of rules) {
      const value = req.body[rule.field];

      // Required check
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required.`);
        continue;
      }

      // Skip further validation if optional and not provided
      if (value === undefined || value === null) continue;

      // Type check
      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${rule.field} must be a string.`);
        continue;
      }
      if (rule.type === 'number' && typeof value !== 'number') {
        errors.push(`${rule.field} must be a number.`);
        continue;
      }
      if (rule.type === 'array' && !Array.isArray(value)) {
        errors.push(`${rule.field} must be an array.`);
        continue;
      }

      // String length constraints
      if (typeof value === 'string') {
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min} characters.`);
        }
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push(`${rule.field} must be ${rule.max} characters or fewer.`);
        }
      }

      // Number range constraints
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}.`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rule.field} must be at most ${rule.max}.`);
        }
      }

      // Enum check
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${rule.field} must be one of: ${rule.enum.join(', ')}.`);
      }

      // Email check
      if (rule.email && !isValidEmail(value)) {
        errors.push(`${rule.field} must be a valid email address.`);
      }

      // Custom validator
      if (rule.custom) {
        const customError = rule.custom(value, req.body);
        if (customError) errors.push(customError);
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError(errors[0]));
    }
    next();
  };
}

/**
 * Middleware: validates that :id param is a valid UUID.
 */
function validateUUIDParam(paramName = 'id') {
  return (req, res, next) => {
    if (!isValidUUID(req.params[paramName])) {
      return next(new ValidationError(`${paramName} must be a valid UUID.`));
    }
    next();
  };
}

module.exports = {
  validateBody,
  validateUUIDParam,
  isValidEmail,
  isValidUUID,
  isValidISO8601,
};
