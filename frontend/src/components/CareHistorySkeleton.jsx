import './CareHistorySection.css';

/**
 * Loading skeleton for the Care History section (SPEC-015).
 * Shows pill placeholders + card placeholders with shimmer animation.
 */
export default function CareHistorySkeleton() {
  return (
    <div className="ch-skeleton" aria-label="Loading care history">
      {/* Filter bar skeleton */}
      <div className="ch-skeleton-filters">
        {[64, 80, 88, 80].map((w, i) => (
          <div
            key={i}
            className="ch-skeleton-pill shimmer"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* List skeleton */}
      <div className="ch-skeleton-list">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ch-skeleton-card shimmer" />
        ))}
      </div>
    </div>
  );
}
