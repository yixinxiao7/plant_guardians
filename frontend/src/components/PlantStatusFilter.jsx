import { useCallback, useRef } from 'react';
import './PlantStatusFilter.css';

/**
 * SPEC-024 §2 — Plant status filter (segmented control).
 *
 * Renders four pill-shaped tabs: All / Overdue / Due today / On track.
 * Each tab shows a count badge fed from the API's `status_counts` field.
 *
 * Props:
 *   value           — 'all' | 'overdue' | 'due_today' | 'on_track' (default 'all')
 *   onChange        — (key) => void called with the new selection key
 *   counts          — { all, overdue, due_today, on_track } | null/undefined
 *                     When undefined the badges render as "—" per SPEC §6 disabled-state
 *   disabled        — when true, all tabs are non-interactive (initial-load)
 */
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'due_today', label: 'Due today' },
  { key: 'on_track', label: 'On track' },
];

export default function PlantStatusFilter({
  value = 'all',
  onChange,
  counts = null,
  disabled = false,
}) {
  const groupRef = useRef(null);

  const select = useCallback((key) => {
    if (disabled) return;
    if (key === value) return; // idempotent
    if (typeof onChange === 'function') onChange(key);
  }, [disabled, value, onChange]);

  const handleKeyDown = useCallback((e, idx) => {
    if (disabled) return;
    let nextIdx = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (idx + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (idx - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = TABS.length - 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(TABS[idx].key);
      return;
    } else {
      return;
    }
    e.preventDefault();
    const buttons = groupRef.current?.querySelectorAll('[role="radio"]');
    const btn = buttons?.[nextIdx];
    if (btn) {
      btn.focus();
      // Per SPEC §7 — arrow keys move focus and activate immediately.
      select(TABS[nextIdx].key);
    }
  }, [disabled, select]);

  // Returns the count for a tab when available. Per SPEC §6, the *visual*
  // count badge shows "—" during initial load (i.e. when no counts have
  // arrived yet). The aria-label still reflects the real count whenever
  // counts are provided so screen readers always have accurate data.
  const countFor = (key) => {
    if (!counts) return null;
    const n = counts[key];
    return typeof n === 'number' ? n : null;
  };

  return (
    <div
      ref={groupRef}
      className={`psf2-group ${disabled ? 'psf2-group--disabled' : ''}`}
      role="radiogroup"
      aria-label="Filter by status"
    >
      {TABS.map((tab, idx) => {
        const isActive = value === tab.key;
        const n = countFor(tab.key);
        const labelText = n !== null ? `${tab.label} (${n})` : `${tab.label}`;
        const ariaLabel = n !== null
          ? `${tab.label} plants, ${n} results`
          : `${tab.label} plants`;
        return (
          <button
            key={tab.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={ariaLabel}
            aria-disabled={disabled || undefined}
            tabIndex={isActive && !disabled ? 0 : -1}
            disabled={disabled}
            className={`psf2-tab psf2-tab--${tab.key} ${isActive ? 'psf2-tab--active' : ''}`}
            onClick={() => select(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            <span className="psf2-label">{tab.label}</span>
            <span className="psf2-count" aria-hidden="true">
              ({n !== null ? n : '—'})
            </span>
            {/* For testing/extra a11y: full text including count */}
            <span className="psf2-sr-text" style={{ display: 'none' }}>{labelText}</span>
          </button>
        );
      })}
    </div>
  );
}
