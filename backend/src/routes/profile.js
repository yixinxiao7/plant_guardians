const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Plant = require('../models/Plant');
const CareAction = require('../models/CareAction');

router.use(authenticate);

// GET /api/v1/profile
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    const [plantCount, totalCareActions] = await Promise.all([
      Plant.countByUserId(req.user.id),
      CareAction.countByUserId(req.user.id),
    ]);

    const now = new Date();
    const createdAt = new Date(user.created_at);
    const diffMs = now.getTime() - createdAt.getTime();
    const daysAsMember = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    res.status(200).json({
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          created_at: user.created_at,
        },
        stats: {
          plant_count: plantCount,
          days_as_member: daysAsMember,
          total_care_actions: totalCareActions,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
