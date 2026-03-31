import { useNavigate } from 'react-router-dom';
import { CheckCircle, Plant, Lightning, WarningCircle } from '@phosphor-icons/react';
import { useAnalyticsStats } from '../hooks/useAnalyticsStats.js';
import StatTile from '../components/StatTile.jsx';
import CareDonutChart from '../components/CareDonutChart.jsx';
import RecentActivityFeed from '../components/RecentActivityFeed.jsx';
import PlantFrequencyTable from '../components/PlantFrequencyTable.jsx';
import './AnalyticsPage.css';

function capitalize(str) {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function SkeletonBlock({ width = '100%', height = '20px', style = {} }) {
  return (
    <div
      className="analytics-skeleton"
      style={{ width, height, borderRadius: '4px', ...style }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="analytics-skeleton-wrapper" aria-busy="true">
      <div aria-live="polite" className="sr-only">Loading care analytics...</div>

      {/* Stats skeleton */}
      <div className="analytics-stats-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="analytics-skeleton-tile">
            <SkeletonBlock width="60%" height="14px" />
            <SkeletonBlock width="40%" height="40px" style={{ margin: '12px 0' }} />
            <SkeletonBlock width="50%" height="12px" />
          </div>
        ))}
      </div>

      {/* Chart + feed skeleton */}
      <div className="analytics-middle-grid">
        <div className="analytics-skeleton-card" style={{ flex: '0 0 55%', height: 300 }} />
        <div className="analytics-skeleton-card" style={{ flex: '0 0 45%', height: 300 }} />
      </div>

      {/* Table skeleton */}
      <div className="analytics-skeleton-card" style={{ padding: 24 }}>
        {[100, 85, 70, 55].map((w, i) => (
          <SkeletonBlock key={i} width={`${w}%`} height="20px" style={{ marginBottom: 16 }} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="analytics-empty">
      <Plant size={64} color="var(--color-border)" aria-hidden="true" />
      <h2 className="analytics-empty-heading">No care history yet</h2>
      <p className="analytics-empty-body">
        No care actions recorded yet. Mark a plant as cared for to start tracking.
      </p>
      <button
        className="analytics-empty-cta"
        onClick={() => navigate('/')}
      >
        Go to my plants
      </button>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  const navigate = useNavigate();
  const isUnauthorized = error?.status === 401;

  return (
    <div className="analytics-error">
      <WarningCircle size={48} color="var(--color-status-red, #C0392B)" />
      <h2 className="analytics-error-heading">
        {isUnauthorized ? 'Session expired' : "Couldn't load your analytics"}
      </h2>
      <p className="analytics-error-body">
        {isUnauthorized
          ? 'Your session has expired. Please log in again.'
          : 'Something went wrong loading your care data. Please try again.'}
      </p>
      {isUnauthorized ? (
        <button
          className="analytics-empty-cta"
          onClick={() => navigate('/login')}
        >
          Log in
        </button>
      ) : (
        <button
          className="analytics-retry-btn"
          onClick={onRetry}
          aria-label="Retry loading analytics"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useAnalyticsStats();

  // Determine most common care type
  const mostCommonType = data?.by_care_type?.length
    ? data.by_care_type.reduce((a, b) => (a.count >= b.count ? a : b))
    : null;

  const topPlant = data?.by_plant?.[0] || null;

  return (
    <main className="analytics-page">
      <div className="analytics-content">
        <h1 className="analytics-title">Care Analytics</h1>
        <p className="analytics-subtitle">A look at how you've been caring for your plants.</p>

        <div aria-live="polite" className="sr-only">
          {!loading && !error && data ? 'Care analytics loaded' : ''}
          {!loading && error ? 'Failed to load care analytics' : ''}
        </div>

        {loading && <LoadingSkeleton />}

        {!loading && error && <ErrorState error={error} onRetry={refetch} />}

        {!loading && !error && data && data.total_care_actions === 0 && <EmptyState />}

        {!loading && !error && data && data.total_care_actions > 0 && (
          <>
            {/* Zone 1: Summary Stats Bar */}
            <div className="analytics-stats-grid">
              <StatTile
                icon={CheckCircle}
                iconColor="#5C7A5C"
                label="Total care actions"
                value={data.total_care_actions}
                subLabel="across all your plants"
              />
              <StatTile
                icon={Plant}
                iconColor="#5C7A5C"
                label="Most cared-for plant"
                value={topPlant ? topPlant.plant_name : '—'}
                subLabel={topPlant ? `${topPlant.count} care actions` : 'Start caring for a plant'}
              />
              <StatTile
                icon={Lightning}
                iconColor="#C4921F"
                label="Most common care type"
                value={mostCommonType ? capitalize(mostCommonType.care_type) : '—'}
                subLabel={mostCommonType ? `${mostCommonType.count} actions total` : ''}
              />
            </div>

            {/* Zone 2: Chart + Activity Feed */}
            <div className="analytics-middle-grid">
              <CareDonutChart
                byType={data.by_care_type}
                total={data.total_care_actions}
              />
              <RecentActivityFeed activities={data.recent_activity} />
            </div>

            {/* Zone 3: Per-Plant Table */}
            <PlantFrequencyTable plants={data.by_plant} />
          </>
        )}
      </div>
    </main>
  );
}
