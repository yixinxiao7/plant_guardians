/**
 * Computes next_due_at, status, and days_overdue for a care schedule.
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

function computeCareStatus(schedule) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

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
 */
function enrichSchedules(schedules) {
  return schedules.map(computeCareStatus);
}

module.exports = { computeCareStatus, enrichSchedules, computeNextDueAt };
