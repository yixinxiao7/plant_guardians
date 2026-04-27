import { useEffect, useRef, useState, useCallback } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import './PlantSearchBar.css';

const DEBOUNCE_MS = 300;
const MAX_LENGTH = 200;

/**
 * SPEC-024 §1 — Plant search bar.
 *
 * Controlled by the parent via `value` + `onChange`. The component keeps a
 * local copy of the input so debouncing can hold off on calling `onChange`
 * for ~300 ms after the last keystroke. If the parent updates `value`
 * externally (e.g. "Clear filters"), the local copy syncs.
 *
 * Props:
 *   value      — current committed search term (string)
 *   onChange   — (string) => void called after the debounce settles or on clear
 *   disabled   — when true, the input is non-interactive (initial-load skeleton)
 */
export default function PlantSearchBar({ value = '', onChange, disabled = false }) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const lastCommittedRef = useRef(value);

  // Sync local input when the parent committed value changes (e.g. Clear filters).
  useEffect(() => {
    if (value !== lastCommittedRef.current) {
      lastCommittedRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  // Cleanup any pending timer on unmount.
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const commit = useCallback((next) => {
    lastCommittedRef.current = next;
    if (typeof onChange === 'function') onChange(next);
  }, [onChange]);

  const handleInput = useCallback((e) => {
    let next = e.target.value;
    if (next.length > MAX_LENGTH) {
      // Hard cap to match backend INVALID_SEARCH_TERM rule (200 chars after trim).
      next = next.slice(0, MAX_LENGTH);
    }
    setLocalValue(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      commit(next.trim());
    }, DEBOUNCE_MS);
  }, [commit]);

  const handleClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalValue('');
    commit('');
    // Return focus to the input (per SPEC §1 / Clear button behavior).
    if (inputRef.current) inputRef.current.focus();
  }, [commit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (localValue !== '') {
        e.preventDefault();
        handleClear();
      } else if (inputRef.current) {
        // Already empty — blur per SPEC §1 keyboard behavior.
        inputRef.current.blur();
      }
    }
  }, [localValue, handleClear]);

  const showClear = localValue !== '';

  return (
    <div
      className={`psb-container ${disabled ? 'psb-container--disabled' : ''}`}
      role="search"
      aria-label="Plant search"
    >
      <MagnifyingGlass
        size={18}
        className="psb-icon"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id="plant-search-input"
        type="search"
        className="psb-input"
        placeholder="Search plants…"
        value={localValue}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        aria-label="Search plants"
        autoComplete="off"
        spellCheck="false"
        maxLength={MAX_LENGTH}
        disabled={disabled}
      />
      {showClear && !disabled && (
        <button
          type="button"
          className="psb-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
