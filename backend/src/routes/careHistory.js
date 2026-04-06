/**
 * Care History routes (T-039) + Batch Care Actions (T-109)
 *
 * GET  /api/v1/care-actions        — paginated care action history for the authenticated user.
 * POST /api/v1/care-actions/batch  — batch-create care actions (T-109).
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isValidUUID, isValidISO8601 } = require('../middleware/validation');
const CareAction = require('../models/CareAction');
const { ValidationError } = require('../utils/errors');

const VALID_CARE_TYPES = ['watering', 'fertilizing', 'repotting'];
const BATCH_MAX_SIZE = 50;

router.use(authenticate);

// GET /api/v1/care-actions?page=1&limit=20&plant_id=<uuid>
router.get('/', async (req, res, next) => {
  try {
    // Parse and validate pagination params
    const pageRaw = req.query.page !== undefined ? req.query.page : '1';
    const limitRaw = req.query.limit !== undefined ? req.query.limit : '20';
    const plantId = req.query.plant_id || null;

    const page = parseInt(pageRaw, 10);
    const limit = parseInt(limitRaw, 10);

    if (isNaN(page) || page < 1 || !Number.isInteger(page)) {
      throw new ValidationError('page must be a positive integer.');
    }
    if (isNaN(limit) || limit < 1 || limit > 100 || !Number.isInteger(limit)) {
      throw new ValidationError('limit must be an integer between 1 and 100.');
    }
    if (plantId !== null && !isValidUUID(plantId)) {
      throw new ValidationError('plant_id must be a valid UUID.');
    }

    const { data, total } = await CareAction.findPaginatedByUser(req.user.id, {
      page,
      limit,
      plantId,
    });

    res.status(200).json({
      data,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/care-actions/batch (T-109)
router.post('/batch', async (req, res, next) => {
  try {
    const { actions } = req.body;

    // Top-level array validation
    if (!Array.isArray(actions) || actions.length === 0 || actions.length > BATCH_MAX_SIZE) {
      throw new ValidationError(
        `actions must be a non-empty array with at most ${BATCH_MAX_SIZE} items`
      );
    }

    // Per-item field validation (reject entire request on first invalid item)
    for (let i = 0; i < actions.length; i++) {
      const item = actions[i];

      if (!item.plant_id || typeof item.plant_id !== 'string' || !isValidUUID(item.plant_id)) {
        throw new ValidationError(
          `actions[${i}].plant_id is required and must be a valid UUID`
        );
      }

      if (!item.care_type || !VALID_CARE_TYPES.includes(item.care_type)) {
        throw new ValidationError(
          `actions[${i}].care_type is required and must be one of: ${VALID_CARE_TYPES.join(', ')}`
        );
      }

      if (!item.performed_at || typeof item.performed_at !== 'string' || !isValidISO8601(item.performed_at)) {
        throw new ValidationError(
          `actions[${i}].performed_at is required and must be a valid ISO 8601 datetime`
        );
      }
    }

    // Delegate to model for ownership check + transactional insert
    const result = await CareAction.batchCreate(req.user.id, actions);

    res.status(207).json({ data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
