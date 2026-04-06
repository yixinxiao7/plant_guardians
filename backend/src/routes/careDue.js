/**
 * Care Due Dashboard routes (T-043, T-116)
 *
 * GET /api/v1/care-due — returns overdue, due_today, and upcoming care events
 * for the authenticated user's plants.
 *
 * T-116: Refactored to use computeNextDueAt from careStatus.js so that
 * date-boundary / status bucketing logic is identical to GET /api/v1/plants.
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const CareSchedule = require('../models/CareSchedule');
const { computeNextDueAt } = require('../utils/careStatus');

router.use(authenticate);

// GET /api/v1/care-due
router.get('/', async (req, res, next) => {
  try {
    // T-060: Accept optional utcOffset query parameter (minutes from UTC)
    let utcOffsetMinutes = 0; // default: UTC
    if (req.query.utcOffset !== undefined) {
      const parsed = parseInt(req.query.utcOffset, 10);
      if (isNaN(parsed) || parsed < -840 || parsed > 840 || String(parsed) !== String(req.query.utcOffset)) {
        return res.status(400).json({
          error: {
            message: 'utcOffset must be an integer in the range -840 to 840.',
            code: 'VALIDATION_ERROR',
          },
        });
      }
      utcOffsetMinutes = parsed;
    }

    const rows = await CareSchedule.findAllWithLastAction(req.user.id);

    // Compute "today" in the user's local timezone — identical to careStatus.js (T-116).
    const now = new Date();
    const localNow = new Date(now.getTime() + utcOffsetMinutes * 60 * 1000);
    const today = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()));

    const msPerDay = 24 * 60 * 60 * 1000;
    const overdue = [];
    const due_today = [];
    const upcoming = [];

    for (const row of rows) {
      // T-116: Use the same computeNextDueAt as careStatus.js for consistent
      // month/week/day arithmetic (months use actual calendar months, not * 30).
      const baseline = row.last_done_at || row.plant_created_at;
      const nextDueAt = computeNextDueAt(
        baseline,
        row.frequency_value,
        row.frequency_unit
      );

      // If computeNextDueAt returns null (no baseline at all), treat as due_today
      if (!nextDueAt) {
        due_today.push({
          plant_id: row.plant_id,
          plant_name: row.plant_name,
          care_type: row.care_type,
          last_done_at: null,
        });
        continue;
      }

      // Truncate nextDueAt to day boundary (same as careStatus.js)
      const dueDate = new Date(Date.UTC(
        nextDueAt.getUTCFullYear(),
        nextDueAt.getUTCMonth(),
        nextDueAt.getUTCDate()
      ));

      // T-116: Use Math.floor (not Math.round) to match careStatus.js
      const diffMs = dueDate.getTime() - today.getTime();
      const diff = Math.floor(diffMs / msPerDay);

      if (diff < 0) {
        // Overdue
        overdue.push({
          plant_id: row.plant_id,
          plant_name: row.plant_name,
          care_type: row.care_type,
          days_overdue: Math.abs(diff),
          last_done_at: row.last_done_at ? new Date(row.last_done_at).toISOString() : null,
        });
      } else if (diff === 0) {
        // Due today
        due_today.push({
          plant_id: row.plant_id,
          plant_name: row.plant_name,
          care_type: row.care_type,
          last_done_at: row.last_done_at ? new Date(row.last_done_at).toISOString() : null,
        });
      } else if (diff >= 1 && diff <= 7) {
        // Upcoming (1-7 days away)
        const dueDate_str = nextDueAt.toISOString().split('T')[0];
        upcoming.push({
          plant_id: row.plant_id,
          plant_name: row.plant_name,
          care_type: row.care_type,
          due_in_days: diff,
          due_date: dueDate_str,
        });
      }
      // diff > 7: on track, not returned
    }

    // Sort per contract:
    // overdue: days_overdue DESC, then plant_name ASC
    overdue.sort((a, b) => b.days_overdue - a.days_overdue || a.plant_name.localeCompare(b.plant_name));
    // due_today: plant_name ASC
    due_today.sort((a, b) => a.plant_name.localeCompare(b.plant_name));
    // upcoming: due_in_days ASC, then plant_name ASC
    upcoming.sort((a, b) => a.due_in_days - b.due_in_days || a.plant_name.localeCompare(b.plant_name));

    res.status(200).json({
      data: {
        overdue,
        due_today,
        upcoming,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
