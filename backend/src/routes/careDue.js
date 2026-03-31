/**
 * Care Due Dashboard routes (T-043)
 *
 * GET /api/v1/care-due — returns overdue, due_today, and upcoming care events
 * for the authenticated user's plants.
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const CareSchedule = require('../models/CareSchedule');

router.use(authenticate);

/**
 * Convert frequency_value + frequency_unit to days.
 */
function frequencyToDays(value, unit) {
  switch (unit) {
    case 'days':
      return value;
    case 'weeks':
      return value * 7;
    case 'months':
      return value * 30;
    default:
      return value;
  }
}

/**
 * Get the start of a UTC day (midnight UTC) for a Date.
 */
function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Difference in whole calendar days (UTC) between two dates.
 * Returns positive if a > b.
 */
function diffDaysUTC(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDayUTC(a) - startOfDayUTC(b)) / msPerDay);
}

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

    // Compute "today" in the user's local timezone.
    // When utcOffset is provided, we shift all date comparisons so that
    // "start of day" aligns with the user's local midnight instead of UTC midnight.
    const now = new Date();
    // "Local now" = UTC now + offset (converting UTC instant to local clock time)
    const localNow = new Date(now.getTime() + utcOffsetMinutes * 60 * 1000);
    // Truncate to local midnight (using UTC methods on the shifted time)
    const todayMs = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate());

    const msPerDay = 24 * 60 * 60 * 1000;
    const overdue = [];
    const due_today = [];
    const upcoming = [];

    for (const row of rows) {
      const frequencyDays = frequencyToDays(row.frequency_value, row.frequency_unit);
      const baseline = row.last_done_at
        ? new Date(row.last_done_at)
        : new Date(row.plant_created_at);
      // Shift baseline to local time, then compute next due at local day granularity
      const baselineLocal = new Date(baseline.getTime() + utcOffsetMinutes * 60 * 1000);
      const baselineDayMs = Date.UTC(baselineLocal.getUTCFullYear(), baselineLocal.getUTCMonth(), baselineLocal.getUTCDate());
      const nextDueMs = baselineDayMs + frequencyDays * msPerDay;

      const diff = Math.round((nextDueMs - todayMs) / msPerDay);

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
        // Express due_date as local calendar date (YYYY-MM-DD)
        const dueDateObj = new Date(nextDueMs);
        const dueDate = dueDateObj.toISOString().split('T')[0];
        upcoming.push({
          plant_id: row.plant_id,
          plant_name: row.plant_name,
          care_type: row.care_type,
          due_in_days: diff,
          due_date: dueDate,
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
