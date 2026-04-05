import { useEffect } from 'react';
import { usePlantCareHistory } from '../hooks/usePlantCareHistory.js';
import CareHistoryFilterBar from './CareHistoryFilterBar.jsx';
import CareHistoryList from './CareHistoryList.jsx';
import CareHistorySkeleton from './CareHistorySkeleton.jsx';
import CareHistoryEmpty from './CareHistoryEmpty.jsx';
import CareHistoryError from './CareHistoryError.jsx';
import Button from './Button.jsx';
import './CareHistorySection.css';

/**
 * Care History section for the Plant Detail page (SPEC-015 / T-094).
 * Shows a filterable, paginated, month-grouped list of care actions.
 */
export default function CareHistorySection({ plantId, onSwitchToOverview }) {
  const {
    items,
    total,
    filter,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    hasMore,
    fetchHistory,
    loadMore,
    changeFilter,
    retry,
  } = usePlantCareHistory(plantId);

  useEffect(() => {
    fetchHistory('all');
  }, [fetchHistory]);

  // Loading state (initial fetch)
  if (isLoading) {
    return (
      <div
        className="care-history-section"
        role="tabpanel"
        aria-busy="true"
        aria-label="Care history"
      >
        <CareHistorySkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="care-history-section"
        role="tabpanel"
        aria-busy="false"
        aria-label="Care history"
      >
        <CareHistoryError message={error} onRetry={retry} />
      </div>
    );
  }

  // Empty state
  if (total === 0) {
    return (
      <div
        className="care-history-section"
        role="tabpanel"
        aria-busy="false"
        aria-label="Care history"
      >
        <CareHistoryEmpty
          filter={filter}
          onSwitchToOverview={onSwitchToOverview}
          onResetFilter={() => changeFilter('all')}
        />
      </div>
    );
  }

  // Populated state
  return (
    <div
      className="care-history-section"
      role="tabpanel"
      aria-busy="false"
      aria-label="Care history"
    >
      <CareHistoryFilterBar activeFilter={filter} onFilterChange={changeFilter} />
      <CareHistoryList items={items} />

      {hasMore && (
        <div className="care-history-load-more">
          <Button
            variant="ghost"
            onClick={loadMore}
            loading={isLoadingMore}
            disabled={isLoadingMore}
            aria-busy={isLoadingMore ? 'true' : 'false'}
            className="care-history-load-more-btn"
          >
            Load More
          </Button>
          {loadMoreError && (
            <p className="care-history-load-more-error">{loadMoreError}</p>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="care-history-end-message">
          You've seen all care history for this plant.
        </p>
      )}
    </div>
  );
}
