/**
 * Computes next_due_at, status, and days_overdue for a care schedule.
 *
 * @param {number} [utcOffsetMinutes=0] — caller's UTC offset in minutes.
 *   Positive = ahead of UTC (e.g. UTC+5:30 → 330).
 *   Used to compute "local today" for status bucketing.
 */

function computeNextDueAt(lastDoneAt, frequencyValue, frequencyUnit) {
  if (!lastDoneAt) return null;

  const base = new Date(lastDoneAt);
  switch (frequencyUnit) {
    case 'days':
      base.setUTCDate(base.getUTCDate() + frequencyValue);
      break;
    case 'weeks':
      base.setUTCDate(base.getUTCDate() + frequencyValue * 7);
      break;
    case 'months':
      base.setUTCMonth(base.getUTCMonth() + frequencyValue);
      break;
    default:
      break;
  }
  return base;
}

function computeCareStatus(schedule, utcOffsetMinutes = 0) {
  const now = new Date();
  // Shift "now" by utcOffset to get the user's local clock time
  const localNow = new Date(now.getTime() + utcOffsetMinutes * 60 * 1000);
  const today = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()));

  const nextDueAt = computeNextDueAt(
    schedule.last_done_at,
    schedule.frequency_value,
    schedule.frequency_unit
  );

  // If no last_done_at, it's due now
  if (!nextDueAt) {
    return {
      ...schedule,
      next_due_at: today.toISOString(),
      status: 'due_today',
      days_overdue: 0,
    };
  }

  const dueDate = new Date(Date.UTC(
    nextDueAt.getUTCFullYear(),
    nextDueAt.getUTCMonth(),
    nextDueAt.getUTCDate()
  ));

  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let status;
  let daysOverdue = 0;

  if (diffDays < 0) {
    status = 'overdue';
    daysOverdue = Math.abs(diffDays);
  } else if (diffDays === 0) {
    status = 'due_today';
  } else {
    status = 'on_track';
  }

  return {
    ...schedule,
    next_due_at: nextDueAt.toISOString(),
    status,
    days_overdue: daysOverdue,
  };
}

/**
 * Enrich an array of care schedule rows with computed fields.
 * @param {Array} schedules
 * @param {number} [utcOffsetMinutes=0] — caller's UTC offset in minutes
 */
function enrichSchedules(schedules, utcOffsetMinutes = 0) {
  return schedules.map((s) => computeCareStatus(s, utcOffsetMinutes));
}

module.exports = { computeCareStatus, enrichSchedules, computeNextDueAt };
