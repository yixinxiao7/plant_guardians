import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Plant as PlantIcon } from '@phosphor-icons/react';
import { usePlants } from '../hooks/usePlants.js';
import { useToast } from '../hooks/useToast.jsx';
import PlantCard from '../components/PlantCard.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import PlantSearchFilter, {
  SearchEmptyState,
  FilterEmptyState,
  CombinedEmptyState,
  SkeletonGrid,
} from '../components/PlantSearchFilter.jsx';
import './InventoryPage.css';

export default function InventoryPage() {
  const { plants, pagination, loading, error, fetchPlants, deletePlant } = usePlants();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const lastFetchParamsRef = useRef({ search: '', status: null });

  const doFetch = useCallback(async (search, status) => {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    lastFetchParamsRef.current = { search, status };
    setFetchError(null);
    try {
      await fetchPlants(params);
      setFetchError(null);
      if (!initialLoaded) setInitialLoaded(true);
    } catch (err) {
      setFetchError(err.message || 'Failed to load plants.');
    }
  }, [fetchPlants, initialLoaded]);

  // Initial fetch
  useEffect(() => {
    doFetch('', null);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    doFetch(query, statusFilter);
  }, [statusFilter, doFetch]);

  const handleStatusChange = useCallback((status) => {
    setStatusFilter(status);
    doFetch(searchQuery, status);
  }, [searchQuery, doFetch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    doFetch('', statusFilter);
  }, [statusFilter, doFetch]);

  const handleResetFilter = useCallback(() => {
    setStatusFilter(null);
    doFetch(searchQuery, null);
  }, [searchQuery, doFetch]);

  const handleRetry = useCallback(() => {
    const { search, status } = lastFetchParamsRef.current;
    doFetch(search, status);
  }, [doFetch]);

  const handleDelete = (plant) => {
    setDeleteTarget(plant);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePlant(deleteTarget.id);
      addToast(`${deleteTarget.name} has been removed.`, 'success');
      setDeleteTarget(null);
      // Re-fetch current view
      doFetch(searchQuery, statusFilter);
    } catch {
      addToast('Failed to delete plant. Try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const isFiltered = !!(searchQuery || statusFilter);
  const totalCount = pagination?.total ?? plants.length;

  // Initial loading (no data yet)
  if (loading && !initialLoaded) {
    return (
      <div className="inventory-page">
        <div className="inventory-header">
          <div>
            <h1 className="inventory-title">My Plants</h1>
          </div>
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  // Error state on initial load (no plants data available)
  if (error && !initialLoaded && plants.length === 0) {
    return (
      <div className="inventory-page">
        <div className="inventory-header">
          <h1 className="inventory-title">My Plants</h1>
        </div>
        <div className="inventory-error" role="alert">
          <p>Couldn't load your plants. Refresh to try again.</p>
          <Button variant="secondary" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state: no plants at all (no filters active)
  if (!loading && plants.length === 0 && !isFiltered && !fetchError) {
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
          <p className="inventory-empty-text">Add your first plant to start tracking your care schedule.</p>
          <Button variant="primary" onClick={() => navigate('/plants/new')}>
            Add Your First Plant
          </Button>
        </div>
      </div>
    );
  }

  // Determine which empty state to show when filtered
  const renderEmptyState = () => {
    if (searchQuery && statusFilter) {
      return (
        <CombinedEmptyState
          onClearSearch={handleClearSearch}
          onResetFilter={handleResetFilter}
        />
      );
    }
    if (searchQuery) {
      return <SearchEmptyState onClear={handleClearSearch} />;
    }
    if (statusFilter) {
      return (
        <FilterEmptyState
          statusFilter={statusFilter}
          onReset={handleResetFilter}
        />
      );
    }
    return null;
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1 className="inventory-title">My Plants</h1>
          <p className="inventory-count">
            {pagination?.total ?? plants.length} plant{(pagination?.total ?? plants.length) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="inventory-actions">
          <Button variant="primary" onClick={() => navigate('/plants/new')}>
            <Plus size={18} weight="bold" />
            <span className="add-plant-label">Add Plant</span>
            <span className="add-plant-icon-only" aria-label="Add Plant">+</span>
          </Button>
        </div>
      </div>

      <PlantSearchFilter
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        totalCount={totalCount}
        isFiltered={isFiltered}
        fetchError={fetchError}
        onRetry={handleRetry}
        onClearSearch={handleClearSearch}
        onResetFilter={handleResetFilter}
      />

      {loading ? (
        <SkeletonGrid />
      ) : plants.length === 0 && isFiltered ? (
        renderEmptyState()
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

      {/* Live region for screen readers */}
      <div aria-live="polite" className="sr-only" />
    </div>
  );
}
