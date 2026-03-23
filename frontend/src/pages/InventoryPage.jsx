import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, Plant as PlantIcon } from '@phosphor-icons/react';
import { usePlants } from '../hooks/usePlants.js';
import { useToast } from '../hooks/useToast.jsx';
import PlantCard from '../components/PlantCard.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import './InventoryPage.css';

export default function InventoryPage() {
  const { plants, loading, error, fetchPlants, deletePlant } = usePlants();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlants().catch(() => {});
  }, [fetchPlants]);

  // Client-side filtering
  const filteredPlants = plants.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.type && p.type.toLowerCase().includes(q));
  });

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
    } catch {
      addToast('Failed to delete plant. Try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Loading state — skeleton cards
  if (loading && plants.length === 0) {
    return (
      <div className="inventory-page">
        <div className="inventory-header">
          <div>
            <h1 className="inventory-title">My Plants</h1>
          </div>
        </div>
        <div className="inventory-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="plant-card-skeleton">
              <div className="skeleton-photo skeleton" />
              <div className="skeleton-body">
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line skeleton-line-short" />
                <div className="skeleton skeleton-badge" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && plants.length === 0) {
    return (
      <div className="inventory-page">
        <div className="inventory-header">
          <h1 className="inventory-title">My Plants</h1>
        </div>
        <div className="inventory-error" role="alert">
          <p>Couldn't load your plants. Refresh to try again.</p>
          <Button variant="secondary" onClick={() => fetchPlants()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && plants.length === 0) {
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

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1 className="inventory-title">My Plants</h1>
          <p className="inventory-count">
            {plants.length} plant{plants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="inventory-actions">
          <div className="inventory-search">
            <MagnifyingGlass size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search plants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search plants"
            />
          </div>
          <Button variant="primary" onClick={() => navigate('/plants/new')}>
            <Plus size={18} weight="bold" />
            Add Plant
          </Button>
        </div>
      </div>

      {searchQuery && filteredPlants.length === 0 ? (
        <div className="inventory-no-results">
          <p>No plants match '{searchQuery}'. Try a different name.</p>
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredPlants.map(plant => (
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
