/**
 * Public, no-auth plant share routes (T-126, Sprint 28).
 *
 * Mounted at /api/v1/public/plants. Intentionally NOT under the authenticated
 * /api/v1/plants router — these endpoints must be accessible without any token
 * and must NOT leak user-identifiable data.
 */

const express = require('express');
const router = express.Router();
const PlantShare = require('../models/PlantShare');
const Plant = require('../models/Plant');
const CareSchedule = require('../models/CareSchedule');
const { AppError } = require('../utils/errors');

function shareNotFound() {
  return new AppError('This plant profile is no longer available.', 404, 'NOT_FOUND');
}

/**
 * Normalize a care schedule frequency to days.
 * - days   → frequency_value
 * - weeks  → frequency_value * 7
 * - months → frequency_value * 30   (calendar-month approximation, matches contract)
 */
function frequencyToDays(schedule) {
  if (!schedule) return null;
  const v = schedule.frequency_value;
  switch (schedule.frequency_unit) {
    case 'days':
      return v;
    case 'weeks':
      return v * 7;
    case 'months':
      return v * 30;
    default:
      return null;
  }
}

// GET /api/v1/public/plants/:shareToken
// Returns only the explicitly-allowlisted public fields for the plant.
// No auth required. Returns 404 for any unknown token.
router.get('/:shareToken', async (req, res, next) => {
  try {
    const { shareToken } = req.params;

    // Cheap shape validation — share tokens are 43-char base64url strings.
    // Bound the lookup to a sensible length range to avoid wasteful DB calls
    // on obviously-malformed tokens. Treat all malformed tokens as 404 (not
    // 400) — this endpoint must not leak whether the format is "almost right."
    if (!shareToken || typeof shareToken !== 'string' || shareToken.length < 1 || shareToken.length > 64) {
      throw shareNotFound();
    }

    const share = await PlantShare.findByToken(shareToken);
    if (!share) {
      throw shareNotFound();
    }

    const plant = await Plant.findById(share.plant_id);
    if (!plant) {
      // Defensive: cascade delete on plants should remove the share row, but
      // if the row exists without a plant for any reason, treat it as 404.
      throw shareNotFound();
    }

    const schedules = await CareSchedule.findByPlantId(plant.id);
    const byType = {};
    for (const s of schedules) byType[s.care_type] = s;

    // Allowlisted public fields ONLY — never include user_id, id, created_at,
    // care history, owner email, etc.
    const aiCareNotes = plant.notes && String(plant.notes).trim() !== '' ? plant.notes : null;

    const data = {
      name: plant.name,
      species: plant.type || null,
      photo_url: plant.photo_url || null,
      watering_frequency_days: frequencyToDays(byType.watering),
      fertilizing_frequency_days: frequencyToDays(byType.fertilizing),
      repotting_frequency_days: frequencyToDays(byType.repotting),
      ai_care_notes: aiCareNotes,
    };

    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
