/**
 * Reminder Service (T-101, Sprint 22)
 *
 * Runs the care reminder job: queries opted-in users for a given hour,
 * computes their overdue/due-today care events, and sends emails.
 */
const NotificationPreference = require('../models/NotificationPreference');
const CareSchedule = require('../models/CareSchedule');
const User = require('../models/User');
const emailService = require('./EmailService');

/**
 * Convert frequency_value + frequency_unit to days.
 * Duplicated from careDue.js for service-layer independence.
 */
function frequencyToDays(value, unit) {
  switch (unit) {
    case 'days': return value;
    case 'weeks': return value * 7;
    case 'months': return value * 30;
    default: return value;
  }
}

const ReminderService = {
  /**
   * Run the reminder job for a specific UTC hour.
   *
   * @param {number} hourUtc - UTC hour (0–23) to evaluate
   * @returns {Promise<{ triggered_at: string, hour_utc: number, users_evaluated: number, emails_sent: number, users_skipped: number }>}
   */
  async runForHour(hourUtc) {
    const triggeredAt = new Date().toISOString();

    // 1. Find all opted-in users for this hour
    const optedInRows = await NotificationPreference.findOptedInByHour(hourUtc);
    const usersEvaluated = optedInRows.length;
    let emailsSent = 0;
    let usersSkipped = 0;

    // 2. For each user, compute care-due status and send email if needed
    for (const row of optedInRows) {
      try {
        const userId = row.user_id;

        // Get user info for email
        const user = await User.findById(userId);
        if (!user) {
          usersSkipped++;
          continue;
        }

        // Get all care schedules with last action
        const scheduleRows = await CareSchedule.findAllWithLastAction(userId);
        if (scheduleRows.length === 0) {
          usersSkipped++;
          continue;
        }

        // Compute overdue and due-today items (UTC-based)
        const now = new Date();
        const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const msPerDay = 24 * 60 * 60 * 1000;

        const overdueItems = [];
        const dueTodayItems = [];

        for (const sched of scheduleRows) {
          const freqDays = frequencyToDays(sched.frequency_value, sched.frequency_unit);
          const baseline = sched.last_done_at
            ? new Date(sched.last_done_at)
            : new Date(sched.plant_created_at);

          const baselineDayMs = Date.UTC(
            baseline.getUTCFullYear(),
            baseline.getUTCMonth(),
            baseline.getUTCDate()
          );
          const nextDueMs = baselineDayMs + freqDays * msPerDay;
          const diff = Math.round((nextDueMs - todayMs) / msPerDay);

          if (diff < 0) {
            overdueItems.push({
              plant_name: sched.plant_name,
              care_type: sched.care_type,
              days_overdue: Math.abs(diff),
            });
          } else if (diff === 0) {
            dueTodayItems.push({
              plant_name: sched.plant_name,
              care_type: sched.care_type,
            });
          }
        }

        // Only send if there's something due or overdue
        if (overdueItems.length === 0 && dueTodayItems.length === 0) {
          usersSkipped++;
          continue;
        }

        const sent = await emailService.sendCareReminder({
          to: user.email,
          userName: user.full_name,
          userId: user.id,
          overdueItems,
          dueTodayItems,
        });

        if (sent) {
          emailsSent++;
        } else {
          usersSkipped++;
        }
      } catch (err) {
        console.error(`[ReminderService] Error processing user ${row.user_id}:`, err.message);
        usersSkipped++;
      }
    }

    return {
      triggered_at: triggeredAt,
      hour_utc: hourUtc,
      users_evaluated: usersEvaluated,
      emails_sent: emailsSent,
      users_skipped: usersSkipped,
    };
  },
};

module.exports = ReminderService;
