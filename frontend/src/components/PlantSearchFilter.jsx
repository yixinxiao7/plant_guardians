import { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlass, X, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import Button from './Button.jsx';
import './PlantSearchFilter.css';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'due_today', label: 'Due Today' },
  { key: 'on_track', label: 'On Track' },
];

const ACTIVE_STYLES = {
  all: {
    background: 'var(--color-accent-primary)',
    color: '#FFFFFF',
    borderColor: 'var(--color-accent-primary)',
  },
  overdue: {
    background: 'var(--color-status-overdue-bg)',
    color: 'var(--color-status-overdue-text)',
    borderColor: 'var(--color-status-overdue-border)',
  },
  due_today: {
    background: 'var(--color-status-due-today-bg)',
    color: 'var(--color-status-due-today-text)',
    borderColor: 'var(--color-status-due-today-border)',
  },
  on_track: {
    background: 'var(--color-status-on-track-bg)',
    color: 'var(--color-status-on-track-text)',
    borderColor: 'var(--color-status-on-track-border)',
  },
};

const FILTER_EMPTY_MESSAGES = {
  overdue: {
    heading: 'No plants are overdue.',
    subtext: 'Great work — all your plants are cared for.',
  },
  due_today: {
    heading: 'Nothing is due today.',
    subtext: "You're all caught up for now.",
  },
  on_track: {
    heading: 'No plants are fully on track yet.',
    subtext: 'Try adding care schedules to your plants.',
  },
};

export default function PlantSearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  totalCount,
  isFiltered,
  fetchError,
  onRetry,
  onClearSearch,
  onResetFilter,
}) {
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const tablistRef = useRef(null);

  // Sync external searchQuery changes
  useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setLocalQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      onSearchChange(val.trim());
    }, 300);
  }, [onSearchChange]);

  const handleClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalQuery('');
    onClearSearch();
    inputRef.current?.focus();
  }, [onClearSearch]);

  const handleTabClick = useCallback((key) => {
    const currentActive = statusFilter || 'all';
    if (key === currentActive) return;
    onStatusChange(key === 'all' ? null : key);
  }, [statusFilter, onStatusChange]);

  // Roving tabindex keyboard nav for filter strip
  const handleTabKeyDown = useCallback((e, index) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % STATUS_TABS.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + STATUS_TABS.length) % STATUS_TABS.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabClick(STATUS_TABS[index].key);
      return;
    }

    if (nextIndex !== null) {
      const tabButtons = tablistRef.current?.querySelectorAll('[role="tab"]');
      if (tabButtons?.[nextIndex]) {
        tabButtons[nextIndex].focus();
      }
    }
  }, [handleTabClick]);

  const activeFilter = statusFilter || 'all';

  return (
    <div className="plant-search-filter">
      {/* Search input */}
      <div className="psf-search-container">
        <MagnifyingGlass
          size={18}
          className="psf-search-icon"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          className="psf-search-input"
          placeholder="Search plants\u2026"
          value={localQuery}
          onChange={handleInputChange}
          aria-label="Search plants"
          autoComplete="off"
          spellCheck="false"
        />
        {localQuery && (
          <button
            className="psf-clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter strip + result count */}
      <div className="psf-filter-row">
        <div
          ref={tablistRef}
          className="psf-tablist"
          role="tablist"
          aria-label="Filter by care status"
        >
          {STATUS_TABS.map((tab, idx) => {
            const isActive = activeFilter === tab.key;
            const style = isActive ? ACTIVE_STYLES[tab.key] : {};
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                className={`psf-tab ${isActive ? 'psf-tab--active' : ''}`}
                style={isActive ? {
                  background: style.background,
                  color: style.color,
                  borderColor: style.borderColor,
                } : undefined}
                onClick={() => handleTabClick(tab.key)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span
          className={`psf-result-count ${isFiltered ? 'psf-result-count--visible' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isFiltered
            ? `Showing ${totalCount} plant${totalCount !== 1 ? 's' : ''}`
            : ''}
        </span>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="psf-error-banner" role="alert">
          <WarningCircle size={18} color="var(--color-status-overdue-text)" aria-hidden="true" />
          <span>Could not load plants. Please try again.</span>
          <Button variant="ghost" size="small" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state components for search/filter results
 */
export function SearchEmptyState({ onClear }) {
  return (
    <div className="psf-empty-state" role="status">
      <MagnifyingGlass size={64} color="var(--color-text-disabled)" />
      <h2 className="psf-empty-heading">No plants match your search.</h2>
      <p className="psf-empty-subtext">
        Try a different name or clear your search to see all plants.
      </p>
      <Button variant="ghost" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}

export function FilterEmptyState({ statusFilter, onReset }) {
  const messages = FILTER_EMPTY_MESSAGES[statusFilter] || FILTER_EMPTY_MESSAGES.overdue;
  return (
    <div className="psf-empty-state" role="status">
      <CheckCircle size={64} color="var(--color-text-disabled)" />
      <h2 className="psf-empty-heading">{messages.heading}</h2>
      <p className="psf-empty-subtext">{messages.subtext}</p>
      <Button variant="secondary" onClick={onReset}>
        Show all plants
      </Button>
    </div>
  );
}

export function CombinedEmptyState({ onClearSearch, onResetFilter }) {
  return (
    <div className="psf-empty-state" role="status">
      <MagnifyingGlass size={64} color="var(--color-text-disabled)" />
      <h2 className="psf-empty-heading">No plants match your search and filter.</h2>
      <p className="psf-empty-subtext">
        Try adjusting your search or filter to find your plants.
      </p>
      <div className="psf-empty-actions">
        <Button variant="ghost" onClick={onClearSearch}>
          Clear search
        </Button>
        <Button variant="secondary" onClick={onResetFilter}>
          Reset filter
        </Button>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="inventory-grid" aria-busy="true" aria-label="Loading plants">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="psf-skeleton-card">
          <div className="psf-skeleton-photo skeleton" />
          <div className="psf-skeleton-body">
            <div className="skeleton psf-skeleton-line" style={{ width: '60%' }} />
            <div className="skeleton psf-skeleton-line" style={{ width: '40%' }} />
            <div className="skeleton psf-skeleton-badge" />
          </div>
        </div>
      ))}
    </div>
  );
}
