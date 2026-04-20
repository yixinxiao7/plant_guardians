const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateBody, validateUUIDParam } = require('../middleware/validation');
const upload = require('../middleware/upload');
const Plant = require('../models/Plant');
const CareSchedule = require('../models/CareSchedule');
const CareAction = require('../models/CareAction');
const PlantShare = require('../models/PlantShare');
const { enrichSchedules } = require('../utils/careStatus');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');

const VALID_CARE_TYPES = ['watering', 'fertilizing', 'repotting'];
const VALID_FREQ_UNITS = ['days', 'weeks', 'months'];
const VALID_STATUSES = ['overdue', 'due_today', 'on_track'];

/**
 * Validate care_schedules array from request body.
 */
function validateCareSchedules(schedules) {
  if (!schedules) return;
  if (!Array.isArray(schedules)) {
    throw new ValidationError('care_schedules must be an array.');
  }
  if (schedules.length > 3) {
    throw new ValidationError('care_schedules can have at most 3 entries.');
  }

  const seen = new Set();
  for (const s of schedules) {
    if (!s.care_type || !VALID_CARE_TYPES.includes(s.care_type)) {
      throw new ValidationError(`care_type must be one of: ${VALID_CARE_TYPES.join(', ')}.`);
    }
    if (seen.has(s.care_type)) {
      throw new ValidationError(`Duplicate care_type: ${s.care_type}. Only one schedule per care type.`);
    }
    seen.add(s.care_type);

    if (!Number.isInteger(s.frequency_value) || s.frequency_value < 1 || s.frequency_value > 365) {
      throw new ValidationError('frequency_value must be an integer between 1 and 365.');
    }
    if (!s.frequency_unit || !VALID_FREQ_UNITS.includes(s.frequency_unit)) {
      throw new ValidationError(`frequency_unit must be one of: ${VALID_FREQ_UNITS.join(', ')}.`);
    }
  }
}

/**
 * Build full plant response with enriched schedules.
 */
async function buildPlantResponse(plant, includeRecentActions = false) {
  const schedules = await CareSchedule.findByPlantId(plant.id);
  const enriched = enrichSchedules(schedules.map((s) => ({
    id: s.id,
    care_type: s.care_type,
    frequency_value: s.frequency_value,
    frequency_unit: s.frequency_unit,
    last_done_at: s.last_done_at,
  })));

  const result = {
    id: plant.id,
    user_id: plant.user_id,
    name: plant.name,
    type: plant.type,
    notes: plant.notes,
    photo_url: plant.photo_url,
    created_at: plant.created_at,
    updated_at: plant.updated_at,
    care_schedules: enriched,
  };

  if (includeRecentActions) {
    const actions = await CareAction.findRecentByPlantId(plant.id, 5);
    result.recent_care_actions = actions.map((a) => ({
      id: a.id,
      care_type: a.care_type,
      performed_at: a.performed_at,
      note: a.note,
    }));
  }

  return result;
}

// All routes require auth
router.use(authenticate);

/**
 * Determine a plant's aggregate care status from its enriched schedules.
 * - "overdue" if at least one schedule is overdue
 * - "due_today" if at least one schedule is due_today (and none overdue)
 * - "on_track" if all schedules are on_track
 * - null if the plant has zero schedules (no computable status)
 */
function plantAggregateStatus(enrichedSchedules) {
  if (enrichedSchedules.length === 0) return null;
  if (enrichedSchedules.some((s) => s.status === 'overdue')) return 'overdue';
  if (enrichedSchedules.some((s) => s.status === 'due_today')) return 'due_today';
  return 'on_track';
}

// GET /api/v1/plants
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    // Validate search param (T-083)
    let search = undefined;
    if (req.query.search !== undefined) {
      search = String(req.query.search).trim();
      if (search.length > 200) {
        throw new ValidationError('search must be at most 200 characters.');
      }
      if (search.length === 0) {
        search = undefined; // empty search treated as no filter
      }
    }

    // Validate status param (T-083)
    let statusFilter = undefined;
    if (req.query.status !== undefined) {
      if (!VALID_STATUSES.includes(req.query.status)) {
        throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}.`);
      }
      statusFilter = req.query.status;
    }

    // Validate utcOffset param (T-083)
    let utcOffsetMinutes = 0;
    if (req.query.utcOffset !== undefined) {
      const parsed = parseInt(req.query.utcOffset, 10);
      if (isNaN(parsed) || parsed < -840 || parsed > 840 || String(parsed) !== String(req.query.utcOffset)) {
        throw new ValidationError('utcOffset must be an integer in the range -840 to 840.');
      }
      utcOffsetMinutes = parsed;
    }

    // When status filter is active, we must compute status for all matching plants
    // before paginating, because status is derived in the application layer.
    const needsAppLevelFiltering = !!statusFilter;

    const { plants: rawPlants, total: rawTotal } = await Plant.findByUserId(req.user.id, {
      page: needsAppLevelFiltering ? 1 : page,
      limit: needsAppLevelFiltering ? undefined : limit,
      search,
      noPagination: needsAppLevelFiltering,
    });

    // Batch load schedules
    const plantIds = rawPlants.map((p) => p.id);
    const allSchedules = await CareSchedule.findByPlantIds(plantIds);

    // Group schedules by plant_id
    const scheduleMap = {};
    for (const s of allSchedules) {
      if (!scheduleMap[s.plant_id]) scheduleMap[s.plant_id] = [];
      scheduleMap[s.plant_id].push(s);
    }

    // Build full plant objects with enriched schedules
    let data = rawPlants.map((plant) => {
      const schedules = scheduleMap[plant.id] || [];
      const enriched = enrichSchedules(schedules.map((s) => ({
        id: s.id,
        care_type: s.care_type,
        frequency_value: s.frequency_value,
        frequency_unit: s.frequency_unit,
        last_done_at: s.last_done_at,
      })), utcOffsetMinutes);

      return {
        id: plant.id,
        user_id: plant.user_id,
        name: plant.name,
        type: plant.type,
        notes: plant.notes,
        photo_url: plant.photo_url,
        created_at: plant.created_at,
        updated_at: plant.updated_at,
        care_schedules: enriched,
      };
    });

    // Apply status filter if provided (T-083)
    let total = rawTotal;
    if (statusFilter) {
      data = data.filter((plant) => {
        const aggStatus = plantAggregateStatus(plant.care_schedules);
        return aggStatus === statusFilter;
      });
      total = data.length;

      // Apply pagination to the filtered set
      const offset = (page - 1) * limit;
      data = data.slice(offset, offset + limit);
    }

    res.status(200).json({
      data,
      pagination: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/plants
router.post(
  '/',
  validateBody([
    { field: 'name', required: true, type: 'string', min: 1, max: 100 },
    { field: 'type', required: false, type: 'string', max: 200 },
    { field: 'notes', required: false, type: 'string', max: 2000 },
    { field: 'photo_url', required: false, type: 'string' },
  ]),
  async (req, res, next) => {
    try {
      const { name, type, notes, photo_url, care_schedules } = req.body;
      validateCareSchedules(care_schedules);

      const plant = await Plant.create({
        user_id: req.user.id,
        name,
        type,
        notes,
        photo_url,
      });

      if (care_schedules && care_schedules.length > 0) {
        await CareSchedule.createMany(plant.id, care_schedules);
      }

      const response = await buildPlantResponse(plant);
      res.status(201).json({ data: response });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/plants/:id
router.get('/:id', validateUUIDParam('id'), async (req, res, next) => {
  try {
    const plant = await Plant.findByIdAndUser(req.params.id, req.user.id);
    if (!plant) {
      throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
    }

    const response = await buildPlantResponse(plant, true);
    res.status(200).json({ data: response });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/plants/:id
router.put(
  '/:id',
  validateUUIDParam('id'),
  validateBody([
    { field: 'name', required: true, type: 'string', min: 1, max: 100 },
    { field: 'type', required: false, type: 'string', max: 200 },
    { field: 'notes', required: false, type: 'string', max: 2000 },
    { field: 'photo_url', required: false, type: 'string' },
  ]),
  async (req, res, next) => {
    try {
      const { name, type, notes, photo_url, care_schedules } = req.body;
      validateCareSchedules(care_schedules);

      const existing = await Plant.findByIdAndUser(req.params.id, req.user.id);
      if (!existing) {
        throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
      }

      const plant = await Plant.update(req.params.id, req.user.id, {
        name,
        type,
        notes,
        photo_url,
      });

      // Full replace of care schedules
      await CareSchedule.replaceForPlant(plant.id, care_schedules || []);

      const response = await buildPlantResponse(plant);
      res.status(200).json({ data: response });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/plants/:id
router.delete('/:id', validateUUIDParam('id'), async (req, res, next) => {
  try {
    const deleted = await Plant.delete(req.params.id, req.user.id);
    if (!deleted) {
      throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
    }

    res.status(200).json({
      data: {
        message: 'Plant deleted successfully.',
        id: req.params.id,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/plants/:id/photo
router.post(
  '/:id/photo',
  validateUUIDParam('id'),
  (req, res, next) => {
    // Custom multer handler to differentiate error codes
    upload.single('photo')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(err); // handled by errorHandler
        }
        if (err instanceof ValidationError) {
          // Re-map to INVALID_FILE_TYPE code
          err.code = 'INVALID_FILE_TYPE';
          return next(err);
        }
        return next(err);
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      const plant = await Plant.findByIdAndUser(req.params.id, req.user.id);
      if (!plant) {
        throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
      }

      if (!req.file) {
        const err = new ValidationError('No file included in request.');
        err.code = 'MISSING_FILE';
        throw err;
      }

      // Build the photo URL — in dev, serve from /uploads/
      const photo_url = `/uploads/${req.file.filename}`;

      res.status(200).json({
        data: { photo_url },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Resolve the canonical frontend base URL for share links.
 * `FRONTEND_URL` may be a comma-separated list (used for CORS); use the first
 * entry as the user-facing canonical origin. Falls back to localhost dev URL.
 */
function resolveFrontendBaseUrl() {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173';
  const first = raw.split(',')[0].trim();
  return first.replace(/\/+$/, ''); // strip trailing slashes
}

// POST /api/v1/plants/:plantId/share — T-126
// Idempotent: if a share already exists for the plant, return its URL.
router.post('/:plantId/share', validateUUIDParam('plantId'), async (req, res, next) => {
  try {
    // Distinguish 404 (plant doesn't exist) from 403 (plant belongs to another user)
    const plant = await Plant.findById(req.params.plantId);
    if (!plant) {
      throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
    }
    if (plant.user_id !== req.user.id) {
      throw new ForbiddenError('You do not have permission to share this plant.');
    }

    let share = await PlantShare.findByPlantId(plant.id);
    if (!share) {
      const shareToken = PlantShare.generateToken();
      share = await PlantShare.create({
        plantId: plant.id,
        userId: req.user.id,
        shareToken,
      });
    }

    const baseUrl = resolveFrontendBaseUrl();
    const share_url = `${baseUrl}/plants/share/${share.share_token}`;

    res.status(200).json({ data: { share_url } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/plants/:plantId/share — T-133
// Returns the active share URL for an owned plant; 404 if no share row exists.
// Used by PlantDetailPage on mount to decide between "Copy link"+"Remove link"
// vs. original "Share" button (see SPEC-023).
router.get('/:plantId/share', validateUUIDParam('plantId'), async (req, res, next) => {
  try {
    // 404 if the plant doesn't exist at all (avoids enumeration);
    // 403 if the plant exists but belongs to another user.
    const plant = await Plant.findById(req.params.plantId);
    if (!plant) {
      throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
    }
    if (plant.user_id !== req.user.id) {
      throw new ForbiddenError('You do not have permission to view this share.');
    }

    const share = await PlantShare.findByPlantId(plant.id);
    if (!share) {
      // Plant is owned but has never been shared (or share was revoked).
      throw new NotFoundError('Share', 'NOT_FOUND');
    }

    const baseUrl = resolveFrontendBaseUrl();
    const share_url = `${baseUrl}/plants/share/${share.share_token}`;
    res.status(200).json({ data: { share_url } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/plants/:plantId/share — T-133
// Revokes the share link for an owned plant. Returns 204 No Content (no body).
// After revocation, GET /api/v1/public/plants/:shareToken returns 404 for the
// old token. Called by ShareRevokeModal (see SPEC-023).
router.delete('/:plantId/share', validateUUIDParam('plantId'), async (req, res, next) => {
  try {
    // 404 if the plant doesn't exist at all (avoids enumeration);
    // 403 if the plant exists but belongs to another user.
    const plant = await Plant.findById(req.params.plantId);
    if (!plant) {
      throw new NotFoundError('Plant', 'PLANT_NOT_FOUND');
    }
    if (plant.user_id !== req.user.id) {
      throw new ForbiddenError('You do not have permission to revoke this share.');
    }

    const deletedCount = await PlantShare.deleteByPlantId(plant.id);
    if (deletedCount === 0) {
      // Plant is owned but has no share row (never shared, or already revoked).
      throw new NotFoundError('Share', 'NOT_FOUND');
    }

    // 204 No Content — do NOT emit a JSON body (per API contract).
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
