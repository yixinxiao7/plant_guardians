/**
 * Care History routes (T-039)
 *
 * GET /api/v1/care-actions — paginated care action history for the authenticated user.
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isValidUUID } = require('../middleware/validation');
const CareAction = require('../models/CareAction');
const { ValidationError } = require('../utils/errors');

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

module.exports = router;
