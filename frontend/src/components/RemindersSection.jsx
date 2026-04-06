import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, X } from '@phosphor-icons/react';
import { notificationPreferences } from '../utils/api.js';
import { useToast } from '../hooks/useToast.jsx';
import './RemindersSection.css';

const TIMING_OPTIONS = [
  { value: 8, label: 'Morning', helper: '~8:00 AM your local time' },
  { value: 12, label: 'Midday', helper: '~12:00 PM your local time' },
  { value: 18, label: 'Evening', helper: '~6:00 PM your local time' },
];

export default function RemindersSection() {
  const { addToast } = useToast();
  const saveButtonRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [reminderHour, setReminderHour] = useState(8);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Track server state to detect dirty
  const [serverOptIn, setServerOptIn] = useState(false);
  const [serverHour, setServerHour] = useState(8);

  useEffect(() => {
    let cancelled = false;
    const fetchPreferences = async () => {
      try {
        const data = await notificationPreferences.get();
        if (cancelled) return;
        setOptIn(data.opt_in);
        setReminderHour(data.reminder_hour_utc);
        setServerOptIn(data.opt_in);
        setServerHour(data.reminder_hour_utc);
        setLoadError(false);
      } catch {
        if (cancelled) return;
        setLoadError(true);
        // Default state: off, morning
        setOptIn(false);
        setReminderHour(8);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPreferences();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = () => {
    const next = !optIn;
    setOptIn(next);
    setDirty(true);
  };

  const handleTimingChange = (value) => {
    setReminderHour(value);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = { opt_in: optIn, reminder_hour_utc: reminderHour };
      const data = await notificationPreferences.update(payload);
      setServerOptIn(data.opt_in);
      setServerHour(data.reminder_hour_utc);
      setDirty(false);
      addToast(
        data.opt_in ? 'Reminder settings saved' : 'Email reminders turned off',
        'success'
      );
    } catch {
      setSaveError("Couldn't save your settings \u2014 please try again.");
    } finally {
      setSaving(false);
    }
  };

  const dismissError = () => setSaveError(null);

  // Show save button when toggle is on, or when toggled off from a previously-on server state
  const showSave = optIn || (dirty && serverOptIn && !optIn);

  return (
    <section
      className="reminders-section"
      aria-busy={loading}
      style={loading ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
    >
      {/* Section Header */}
      <div className="reminders-header">
        <Bell size={18} color="var(--color-accent)" weight="regular" />
        <h3 className="reminders-title">Reminders</h3>
      </div>

      {/* Toggle Row */}
      <div className="reminders-toggle-row">
        <div className="reminders-toggle-labels">
          <span className="reminders-toggle-primary">
            Get email reminders when care is due
          </span>
          <span className="reminders-toggle-secondary" id="reminder-toggle-desc">
            We'll email you at your chosen time on days when plant care is due or overdue.
          </span>
        </div>
        <button
          role="switch"
          aria-checked={optIn}
          aria-label="Email reminders"
          aria-describedby="reminder-toggle-desc"
          className={`reminders-toggle-switch ${optIn ? 'reminders-toggle-switch--on' : ''}`}
          onClick={handleToggle}
          disabled={loading || saving}
        >
          <span className="reminders-toggle-thumb" />
        </button>
      </div>

      {/* Load Error */}
      {loadError && !loading && (
        <p className="reminders-load-error">Could not load your current settings.</p>
      )}

      {/* Timing Selector */}
      <div
        className={`reminders-timing-wrapper ${optIn ? 'reminders-timing-wrapper--open' : ''}`}
        aria-hidden={!optIn}
      >
        <div className="reminders-timing-selector">
          <span className="reminders-timing-label">Send reminder at:</span>
          <div role="radiogroup" aria-label="Reminder time">
            {TIMING_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`reminders-radio-option ${reminderHour === opt.value ? 'reminders-radio-option--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="reminderTime"
                  value={opt.value}
                  checked={reminderHour === opt.value}
                  onChange={() => handleTimingChange(opt.value)}
                  disabled={saving}
                  className="reminders-radio-input"
                />
                <span className="reminders-radio-content">
                  <span className="reminders-radio-primary">{opt.label}</span>
                  <span className="reminders-radio-helper">{opt.helper}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      {showSave && (
        <button
          ref={saveButtonRef}
          className="reminders-save-btn"
          onClick={handleSave}
          disabled={saving}
          aria-label={optIn ? 'Save reminder settings' : 'Save changes'}
        >
          {saving ? (
            <>
              <span className="reminders-save-spinner" />
              Saving\u2026
            </>
          ) : (
            optIn ? 'Save reminder settings' : 'Save changes'
          )}
        </button>
      )}

      {/* Save Error */}
      {saveError && (
        <div className="reminders-save-error" role="alert">
          <span>{saveError}</span>
          <button
            className="reminders-save-error-dismiss"
            onClick={dismissError}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
