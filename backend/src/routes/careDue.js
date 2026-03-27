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
    const rows = await CareSchedule.findAllWithLastAction(req.user.id);

    const today = startOfDayUTC(new Date());
    const overdue = [];
    const due_today = [];
    const upcoming = [];

    for (const row of rows) {
      const frequencyDays = frequencyToDays(row.frequency_value, row.frequency_unit);
      const baseline = row.last_done_at
        ? new Date(row.last_done_at)
        : new Date(row.plant_created_at);
      const nextDue = startOfDayUTC(new Date(baseline.getTime() + frequencyDays * 24 * 60 * 60 * 1000));

      const diff = diffDaysUTC(nextDue, today);

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
        });
      } else if (diff >= 1 && diff <= 7) {
        // Upcoming (1-7 days away)
        const dueDate = nextDue.toISOString().split('T')[0];
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
