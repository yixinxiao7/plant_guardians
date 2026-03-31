/**
 * Care Action Stats route (T-064)
 *
 * GET /api/v1/care-actions/stats — aggregated care action statistics
 * for the authenticated user's plants.
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const CareAction = require('../models/CareAction');

router.use(authenticate);

// GET /api/v1/care-actions/stats
router.get('/', async (req, res, next) => {
  try {
    const stats = await CareAction.getStatsByUser(req.user.id);

    res.status(200).json({
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
