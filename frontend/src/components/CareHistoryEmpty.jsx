import { Plant } from '@phosphor-icons/react';
import Button from './Button.jsx';
import './CareHistorySection.css';

const FILTER_LABELS = {
  watering: 'Watering',
  fertilizing: 'Fertilizing',
  repotting: 'Repotting',
};

/**
 * Empty state for Care History (SPEC-015).
 * Two variants: generic empty (no history at all) and filter-specific empty.
 */
export default function CareHistoryEmpty({ filter, onSwitchToOverview, onResetFilter }) {
  const isFiltered = filter !== 'all';

  if (isFiltered) {
    const typeLabel = FILTER_LABELS[filter] || filter;
    return (
      <div className="ch-empty">
        <Plant size={64} weight="light" className="ch-empty-icon" aria-hidden="true" />
        <h3 className="ch-empty-heading">No {typeLabel} history yet.</h3>
        <p className="ch-empty-body">Switch to &ldquo;All&rdquo; to see all care actions.</p>
        <Button variant="ghost" onClick={onResetFilter}>
          Show All
        </Button>
      </div>
    );
  }

  return (
    <div className="ch-empty">
      <Plant size={64} weight="light" className="ch-empty-icon" aria-hidden="true" />
      <h3 className="ch-empty-heading">No care history yet.</h3>
      <p className="ch-empty-body">Mark your first care action done and it will show up here.</p>
      <Button variant="secondary" onClick={onSwitchToOverview}>
        Go to Overview
      </Button>
    </div>
  );
}
