import './CareHistorySection.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'watering', label: 'Watering' },
  { key: 'fertilizing', label: 'Fertilizing' },
  { key: 'repotting', label: 'Repotting' },
];

/**
 * Pill-style filter bar for care type selection (SPEC-015).
 */
export default function CareHistoryFilterBar({ activeFilter, onFilterChange }) {
  return (
    <div
      className="ch-filter-bar"
      role="group"
      aria-label="Filter care history by type"
    >
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          className={`ch-filter-pill ${activeFilter === key ? 'ch-filter-pill--active' : ''}`}
          aria-pressed={activeFilter === key ? 'true' : 'false'}
          onClick={() => onFilterChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
