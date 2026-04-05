/**
 * Email Service (T-101, Sprint 22)
 *
 * Wraps Nodemailer for sending care reminder emails.
 * Gracefully degrades to a no-op when SMTP is not configured.
 */
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.enabled = false;
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'Plant Guardians <noreply@plantguardians.app>';
    this.appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

    if (!process.env.EMAIL_HOST) {
      console.log('[EmailService] WARNING: EMAIL_HOST not configured — email sending disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    this.enabled = true;
    console.log('[EmailService] SMTP configured — email sending enabled');
  }

  /**
   * Generate an HMAC-signed unsubscribe token for a user.
   * Token = base64url(HMAC-SHA256(secret, userId))
   */
  get unsubscribeSecret() {
    return process.env.UNSUBSCRIBE_SECRET || '';
  }

  generateUnsubscribeToken(userId) {
    if (!this.unsubscribeSecret) return null;
    const hmac = crypto.createHmac('sha256', this.unsubscribeSecret);
    hmac.update(userId);
    return hmac.digest('base64url');
  }

  /**
   * Verify an unsubscribe token. Returns the userId if valid, null if invalid.
   * Since the token is HMAC(secret, userId), we need to try against the provided userId.
   */
  verifyUnsubscribeToken(token, userId) {
    if (!this.unsubscribeSecret || !token || !userId) return false;
    const expected = this.generateUnsubscribeToken(userId);
    if (!expected) return false;
    // Constant-time comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token, 'base64url'),
        Buffer.from(expected, 'base64url')
      );
    } catch {
      return false;
    }
  }

  /**
   * Build the unsubscribe URL for a user.
   */
  buildUnsubscribeUrl(userId) {
    const token = this.generateUnsubscribeToken(userId);
    if (!token) return null;
    return `${this.appBaseUrl}/unsubscribe?token=${encodeURIComponent(token)}&uid=${encodeURIComponent(userId)}`;
  }

  /**
   * Send a care reminder email to a user.
   *
   * @param {object} params
   * @param {string} params.to - Recipient email address
   * @param {string} params.userName - User's display name
   * @param {string} params.userId - User UUID (for unsubscribe link)
   * @param {Array} params.overdueItems - Array of { plant_name, care_type, days_overdue }
   * @param {Array} params.dueTodayItems - Array of { plant_name, care_type }
   * @returns {Promise<boolean>} true if sent, false if skipped/failed
   */
  async sendCareReminder({ to, userName, userId, overdueItems, dueTodayItems }) {
    if (!this.enabled) return false;

    const unsubscribeUrl = this.buildUnsubscribeUrl(userId);
    const totalItems = (overdueItems?.length || 0) + (dueTodayItems?.length || 0);

    const subject = totalItems === 1
      ? 'Your plant needs care today!'
      : `${totalItems} plants need your care today!`;

    const html = this._buildReminderHtml({
      userName,
      overdueItems: overdueItems || [],
      dueTodayItems: dueTodayItems || [],
      unsubscribeUrl,
    });

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error(`[EmailService] Failed to send reminder to ${to}:`, err.message);
      return false;
    }
  }

  /**
   * Build the HTML body for a care reminder email.
   */
  _buildReminderHtml({ userName, overdueItems, dueTodayItems, unsubscribeUrl }) {
    const greeting = userName ? `Hi ${userName},` : 'Hi there,';

    let overdueSection = '';
    if (overdueItems.length > 0) {
      const rows = overdueItems.map(item =>
        `<li><strong>${this._escape(item.plant_name)}</strong> — ${this._escape(item.care_type)} (${item.days_overdue} day${item.days_overdue !== 1 ? 's' : ''} overdue)</li>`
      ).join('\n');
      overdueSection = `
        <h3 style="color: #d32f2f;">Overdue</h3>
        <ul>${rows}</ul>
      `;
    }

    let dueTodaySection = '';
    if (dueTodayItems.length > 0) {
      const rows = dueTodayItems.map(item =>
        `<li><strong>${this._escape(item.plant_name)}</strong> — ${this._escape(item.care_type)}</li>`
      ).join('\n');
      dueTodaySection = `
        <h3 style="color: #ed6c02;">Due Today</h3>
        <ul>${rows}</ul>
      `;
    }

    const unsubscribeFooter = unsubscribeUrl
      ? `<p style="font-size: 12px; color: #888; margin-top: 32px;">
           <a href="${unsubscribeUrl}" style="color: #888;">Unsubscribe</a> from care reminder emails.
         </p>`
      : '';

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2e7d32;">Plant Guardians</h2>
        <p>${greeting}</p>
        <p>Your plants need some attention:</p>
        ${overdueSection}
        ${dueTodaySection}
        <p style="margin-top: 24px;">
          <a href="${this.appBaseUrl}" style="background: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Open Plant Guardians
          </a>
        </p>
        ${unsubscribeFooter}
      </div>
    `;
  }

  /**
   * Escape HTML special characters to prevent XSS in email bodies.
   */
  _escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Singleton instance
module.exports = new EmailService();
