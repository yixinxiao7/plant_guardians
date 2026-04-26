import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, Funnel, WarningCircle } from '@phosphor-icons/react';
import { usePlants } from '../hooks/usePlants.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import PlantCard from '../components/PlantCard.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import PlantSearchBar from '../components/PlantSearchBar.jsx';
import PlantStatusFilter from '../components/PlantStatusFilter.jsx';
import PlantSortDropdown, { SORT_OPTIONS } from '../components/PlantSortDropdown.jsx';
import { SkeletonGrid } from '../components/PlantSearchFilter.jsx';
import './InventoryPage.css';

const DEFAULT_SORT = 'name_asc';

// Maps the in-page status filter key to the backend `status` query value.
// The 'all' key means "no filter" — pass undefined.
function statusKeyToParam(key) {
  return key === 'all' ? undefined : key;
}

// Per SPEC-024 §5b — filter label used in empty state messages.
const FILTER_LABEL = {
  overdue: 'overdue',
  due_today: 'due today',
  on_track: 'on track',
};

export default function InventoryPage() {
  const {
    plants,
    pagination,
    statusCounts,
    loading,
    error,
    fetchPlants,
    deletePlant,
  } = usePlants();
  const { user, consumeOAuthToast } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // SPEC-024 control state.
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState(DEFAULT_SORT);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const lastFetchRef = useRef({ search: '', status: 'all', sort: DEFAULT_SORT });

  // Build the API query and fetch.
  const doFetch = useCallback(async (search, status, sort) => {
    const params = {};
    if (search) params.search = search;
    const statusParam = statusKeyToParam(status);
    if (statusParam) params.status = statusParam;
    if (sort && sort !== DEFAULT_SORT) params.sort = sort;
    lastFetchRef.current = { search, status, sort };
    setFetchError(null);
    try {
      await fetchPlants(params);
      setFetchError(null);
      setInitialLoaded(true);
    } catch (err) {
      setFetchError(err?.message || 'Failed to load plants.');
    }
  }, [fetchPlants]);

  // OAuth welcome toast (preserved from prior implementation).
  useEffect(() => {
    const oauthInfo = consumeOAuthToast();
    if (!oauthInfo) return;
    const firstName = user?.full_name?.split(' ')[0] || '';
    if (oauthInfo.linked) {
      addToast(`Your Google account has been linked. Welcome back, ${firstName}! 🌿`, 'success');
    } else if (firstName) {
      addToast(`Welcome back, ${firstName}! 🌿`, 'success');
    } else {
      addToast('Welcome to Plant Guardians! 🌿', 'success');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch.
  useEffect(() => {
    doFetch('', 'all', DEFAULT_SORT);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers — every change re-fetches with the combined params (SPEC §4).
  const handleSearchChange = useCallback((next) => {
    setSearchQuery(next);
    doFetch(next, statusFilter, sortOption);
  }, [doFetch, statusFilter, sortOption]);

  const handleStatusChange = useCallback((next) => {
    setStatusFilter(next);
    doFetch(searchQuery, next, sortOption);
  }, [doFetch, searchQuery, sortOption]);

  const handleSortChange = useCallback((next) => {
    setSortOption(next);
    doFetch(searchQuery, statusFilter, next);
  }, [doFetch, searchQuery, statusFilter]);

  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOption(DEFAULT_SORT);
    doFetch('', 'all', DEFAULT_SORT);
  }, [doFetch]);

  const handleRetry = useCallback(() => {
    const { search, status, sort } = lastFetchRef.current;
    doFetch(search, status, sort);
  }, [doFetch]);

  const handleDelete = (plant) => setDeleteTarget(plant);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePlant(deleteTarget.id);
      addToast(`${deleteTarget.name} has been removed.`, 'success');
      setDeleteTarget(null);
      // Re-fetch current view so counts/pagination update.
      doFetch(searchQuery, statusFilter, sortOption);
    } catch {
      addToast('Failed to delete plant. Try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ---- Derived state ----
  const isAnyFilterActive = useMemo(() => (
    !!searchQuery || statusFilter !== 'all' || sortOption !== DEFAULT_SORT
  ), [searchQuery, statusFilter, sortOption]);

  // SPEC §6 — controls only show the disabled/skeleton state on the *initial*
  // load, before any data has arrived.
  const controlsDisabled = !initialLoaded && loading;

  const totalCount = pagination?.total ?? plants.length;

  // Live region announcements — SPEC §7.
  useEffect(() => {
    if (loading) return; // Wait for results before announcing.
    if (!initialLoaded) return;
    if (totalCount === 0) {
      setLiveAnnouncement('No plants found.');
      return;
    }
    const filterLabel = FILTER_LABEL[statusFilter];
    const search = searchQuery;
    const plantWord = totalCount === 1 ? 'plant' : 'plants';
    if (search && filterLabel) {
      setLiveAnnouncement(`Showing ${totalCount} ${filterLabel} ${plantWord} matching "${search}".`);
    } else if (search) {
      setLiveAnnouncement(`Showing ${totalCount} ${plantWord} matching "${search}".`);
    } else if (filterLabel) {
      setLiveAnnouncement(`Showing ${totalCount} ${filterLabel} ${plantWord}.`);
    } else {
      setLiveAnnouncement(`Showing ${totalCount} ${plantWord}.`);
    }
  }, [loading, initialLoaded, totalCount, statusFilter, searchQuery]);

  // ---- Renderers ----

  // Initial loading (no data yet) — show controls in disabled state per SPEC §6.
  // We still render the page header + controls so the layout doesn't shift.
  // We always render below; control disabling is handled by `controlsDisabled`.

  // Hard error on initial load — no data available at all.
  if (error && !initialLoaded && plants.length === 0) {
    return (
      <div className="inventory-page">
        <div className="inventory-header">
          <h1 className="inventory-title">My Plants</h1>
        </div>
        <div className="inventory-error" role="alert">
          <p>Couldn't load your plants. Refresh to try again.</p>
          <Button variant="secondary" onClick={handleRetry}>Retry</Button>
        </div>
      </div>
    );
  }

  // Empty inventory — user has zero plants, no filters active. SPEC §5d.
  // (Only show this if we've actually finished loading & have no plants & no
  // filter is active. If a filter or search IS active, fall through to the
  // SPEC §5a–c filtered empty states.)
  if (
    initialLoaded
    && !loading
    && plants.length === 0
    && !isAnyFilterActive
    && !fetchError
  ) {
    return (
      <div className="inventory-page">
        <div className="inventory-header">
          <h1 className="inventory-title">My Plants</h1>
        </div>
        <div className="inventory-empty">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="24" y="50" width="32" height="20" rx="4" stroke="#B8CEB8" strokeWidth="2" fill="none"/>
            <path d="M40 50C40 50 32 38 32 28C32 20 36 16 40 16C44 16 48 20 48 28C48 38 40 50 40 50Z" stroke="#B8CEB8" strokeWidth="2" fill="none"/>
            <path d="M40 50C40 50 52 42 56 34C60 26 56 20 52 20C48 20 46 24 48 30" stroke="#B8CEB8" strokeWidth="2" fill="none"/>
          </svg>
          <h2 className="inventory-empty-title">Your garden is waiting.</h2>
          <p className="inventory-empty-text">
            Add your first plant to start tracking your care schedule.
          </p>
          <Button variant="primary" onClick={() => navigate('/plants/new')}>
            Add Your First Plant
          </Button>
        </div>
      </div>
    );
  }

  // SPEC-024 §5a/5b/5c — filtered empty states (any control non-default + 0 results).
  const renderFilteredEmptyState = () => {
    const filterLabel = FILTER_LABEL[statusFilter];
    let icon = null;
    let message = '';

    if (searchQuery && filterLabel) {
      icon = <MagnifyingGlass size={40} aria-hidden="true" className="inv-empty-icon" />;
      message = `No ${filterLabel} plants match your search.`;
    } else if (searchQuery) {
      icon = <MagnifyingGlass size={40} aria-hidden="true" className="inv-empty-icon" />;
      message = 'No plants match your search.';
    } else if (filterLabel) {
      icon = <Funnel size={40} aria-hidden="true" className="inv-empty-icon" />;
      message = `No ${filterLabel} plants.`;
    } else {
      // Defensive — sort change alone shouldn't produce an empty state, but
      // handle gracefully.
      icon = <Funnel size={40} aria-hidden="true" className="inv-empty-icon" />;
      message = 'No plants match the current filters.';
    }

    return (
      <div className="inv-filtered-empty" role="status">
        {icon}
        <p className="inv-filtered-empty-message">{message}</p>
        <button
          type="button"
          className="inv-clear-link"
          onClick={handleClearAll}
        >
          Clear filters
        </button>
      </div>
    );
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1 className="inventory-title">My Plants</h1>
          {initialLoaded && (
            <p className="inventory-count">
              {totalCount} plant{totalCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="inventory-actions">
          <Button variant="primary" onClick={() => navigate('/plants/new')}>
            <Plus size={18} weight="bold" />
            <span className="add-plant-label">Add Plant</span>
            <span className="add-plant-icon-only" aria-label="Add Plant">+</span>
          </Button>
        </div>
      </div>

      {/* SPEC-024 — controls zone */}
      <div className="inv-controls">
        <PlantSearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={controlsDisabled}
        />
        <div className="inv-filter-row">
          <PlantStatusFilter
            value={statusFilter}
            onChange={handleStatusChange}
            counts={statusCounts}
            disabled={controlsDisabled}
          />
          <PlantSortDropdown
            value={sortOption}
            onChange={handleSortChange}
            disabled={controlsDisabled}
          />
        </div>
        {isAnyFilterActive && (
          <button
            type="button"
            className="inv-clear-link inv-clear-link--inline"
            onClick={handleClearAll}
          >
            Clear filters
          </button>
        )}
        {fetchError && (
          <div className="inv-fetch-error" role="alert">
            <WarningCircle
              size={18}
              color="var(--color-status-overdue-text)"
              aria-hidden="true"
            />
            <span>{fetchError}</span>
            <Button variant="ghost" size="small" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}
      </div>

      {/* Grid / loading / empty rendering */}
      {loading ? (
        <SkeletonGrid />
      ) : plants.length === 0 ? (
        renderFilteredEmptyState()
      ) : (
        <div className="inventory-grid" aria-busy={loading}>
          {plants.map(plant => (
            <PlantCard key={plant.id} plant={plant} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.name}?`}
      >
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          This will permanently remove {deleteTarget?.name} from your garden. This can't be undone.
        </p>
        <div className="delete-modal-actions">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={deleting}>
            Yes, remove it
          </Button>
        </div>
      </Modal>

      {/* Live region — SPEC-024 §7 */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="inv-live-region"
      >
        {liveAnnouncement}
      </div>
    </div>
  );
}

// Re-export for tests / future use.
export { SORT_OPTIONS };
