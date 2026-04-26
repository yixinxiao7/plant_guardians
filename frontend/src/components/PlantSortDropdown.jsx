import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import './PlantSortDropdown.css';

/**
 * SPEC-024 §3 — Plant sort dropdown.
 *
 * Custom button + listbox pattern (not a native <select>) so we can match the
 * Plant Guardians visual system exactly. Keyboard accessible per WAI-ARIA APG.
 *
 * Props:
 *   value     — current sort key. Default 'name_asc'.
 *   onChange  — (key) => void invoked when the user selects a different option.
 *   disabled  — when true the trigger is non-interactive (initial-load skeleton).
 */
export const SORT_OPTIONS = [
  { key: 'name_asc', label: 'Name A–Z' },
  { key: 'name_desc', label: 'Name Z–A' },
  { key: 'most_overdue', label: 'Most overdue first' },
  { key: 'next_due_soonest', label: 'Next due soonest' },
];

const DEFAULT_SORT = 'name_asc';

export default function PlantSortDropdown({
  value = DEFAULT_SORT,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, SORT_OPTIONS.findIndex(o => o.key === value)),
  );
  const triggerRef = useRef(null);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const currentOption = SORT_OPTIONS.find(o => o.key === value) || SORT_OPTIONS[0];
  const isNonDefault = currentOption.key !== DEFAULT_SORT;

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // When opened, sync activeIndex to currently-selected and focus the listbox.
  useEffect(() => {
    if (open) {
      const idx = Math.max(0, SORT_OPTIONS.findIndex(o => o.key === value));
      setActiveIndex(idx);
      if (listRef.current) {
        // Defer focus so the element exists in the DOM after render.
        requestAnimationFrame(() => {
          if (listRef.current) listRef.current.focus();
        });
      }
    }
  }, [open, value]);

  const closeAndFocusTrigger = useCallback(() => {
    setOpen(false);
    if (triggerRef.current) triggerRef.current.focus();
  }, []);

  const select = useCallback((key) => {
    if (key !== value && typeof onChange === 'function') {
      onChange(key);
    }
    closeAndFocusTrigger();
  }, [value, onChange, closeAndFocusTrigger]);

  const handleTriggerClick = () => {
    if (disabled) return;
    setOpen(prev => !prev);
  };

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleListKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAndFocusTrigger();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % SORT_OPTIONS.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(SORT_OPTIONS.length - 1);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(SORT_OPTIONS[activeIndex].key);
    }
  };

  return (
    <div className="psd-container" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        id="plant-sort-trigger"
        className={`psd-trigger ${isNonDefault ? 'psd-trigger--non-default' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Sort plants"
        disabled={disabled}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="psd-trigger-label">{currentOption.label}</span>
        <CaretDown size={14} aria-hidden="true" className="psd-caret" />
      </button>

      {open && (
        <ul
          ref={listRef}
          className="psd-listbox"
          role="listbox"
          aria-labelledby="plant-sort-trigger"
          aria-activedescendant={`plant-sort-option-${SORT_OPTIONS[activeIndex].key}`}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {SORT_OPTIONS.map((opt, idx) => {
            const selected = opt.key === value;
            const focused = idx === activeIndex;
            return (
              <li
                key={opt.key}
                id={`plant-sort-option-${opt.key}`}
                role="option"
                aria-selected={selected}
                className={`psd-option ${selected ? 'psd-option--selected' : ''} ${focused ? 'psd-option--focused' : ''}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => select(opt.key)}
              >
                <span className="psd-option-label">{opt.label}</span>
                {selected && (
                  <Check size={14} className="psd-option-check" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
