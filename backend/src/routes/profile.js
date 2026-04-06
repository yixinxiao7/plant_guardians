const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Plant = require('../models/Plant');
const CareAction = require('../models/CareAction');
const { NotFoundError } = require('../utils/errors');
const { clearRefreshTokenCookie } = require('../utils/cookieConfig');

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

// DELETE /api/v1/profile — permanently delete the authenticated user's account (T-106)
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Collect photo URLs before deletion (for file cleanup)
    const photoUrls = await User.findPhotoUrlsByUserId(userId);

    // Delete user and all associated data in a single transaction
    const deletedCount = await User.deleteWithAllData(userId);

    if (deletedCount === 0) {
      throw new NotFoundError('User', 'USER_NOT_FOUND');
    }

    // Best-effort cleanup of uploaded photo files
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    for (const url of photoUrls) {
      try {
        const filename = url.split('/').pop();
        if (filename) {
          const filePath = path.resolve(uploadDir, filename);
          fs.unlinkSync(filePath);
        }
      } catch {
        // File may already be missing — non-critical, continue
      }
    }

    // Clear the refresh token cookie
    clearRefreshTokenCookie(res);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
