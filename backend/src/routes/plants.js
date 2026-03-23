const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateBody, validateUUIDParam } = require('../middleware/validation');
const upload = require('../middleware/upload');
const Plant = require('../models/Plant');
const CareSchedule = require('../models/CareSchedule');
const CareAction = require('../models/CareAction');
const { enrichSchedules } = require('../utils/careStatus');
const { NotFoundError, ValidationError } = require('../utils/errors');

const VALID_CARE_TYPES = ['watering', 'fertilizing', 'repotting'];
const VALID_FREQ_UNITS = ['days', 'weeks', 'months'];

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

// GET /api/v1/plants
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const { plants, total } = await Plant.findByUserId(req.user.id, { page, limit });

    // Batch load schedules
    const plantIds = plants.map((p) => p.id);
    const allSchedules = await CareSchedule.findByPlantIds(plantIds);

    // Group schedules by plant_id
    const scheduleMap = {};
    for (const s of allSchedules) {
      if (!scheduleMap[s.plant_id]) scheduleMap[s.plant_id] = [];
      scheduleMap[s.plant_id].push(s);
    }

    const data = plants.map((plant) => {
      const schedules = scheduleMap[plant.id] || [];
      const enriched = enrichSchedules(schedules.map((s) => ({
        id: s.id,
        care_type: s.care_type,
        frequency_value: s.frequency_value,
        frequency_unit: s.frequency_unit,
        last_done_at: s.last_done_at,
      })));

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
    { field: 'name', required: true, type: 'string', min: 1, max: 200 },
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
    { field: 'name', required: true, type: 'string', min: 1, max: 200 },
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
        throw new ValidationError('No file included in request.');
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

module.exports = router;
