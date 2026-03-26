import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drop, Leaf, PottedPlant, WarningCircle } from '@phosphor-icons/react';
import { plants as plantsApi } from '../utils/api.js';
import { useCareHistory } from '../hooks/useCareHistory.js';
import { formatRelativeTime, formatFullDateTime } from '../utils/formatDate.js';
import Button from '../components/Button.jsx';
import './CareHistoryPage.css';

const CARE_TYPE_CONFIG = {
  watering: {
    icon: Drop,
    label: 'Watered',
    bgColor: '#EBF4F7',
    iconColor: '#5B8FA8',
  },
  fertilizing: {
    icon: Leaf,
    label: 'Fertilized',
    bgColor: '#E8F4EC',
    iconColor: '#4A7C59',
  },
  repotting: {
    icon: PottedPlant,
    label: 'Repotted',
    bgColor: '#F4EDE8',
    iconColor: '#A67C5B',
  },
};

export default function CareHistoryPage() {
  const navigate = useNavigate();
  const {
    actions,
    pagination,
    loading,
    loadingMore,
    error,
    hasMore,
    remaining,
    fetchActions,
    loadMore,
  } = useCareHistory();

  const [plantList, setPlantList] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [plantsLoaded, setPlantsLoaded] = useState(false);

  // Load plants for filter dropdown
  useEffect(() => {
    const loadPlants = async () => {
      try {
        const data = await plantsApi.list(1, 200);
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setPlantList(list);
      } catch {
        // Non-critical — filter just won't have plant options
      } finally {
        setPlantsLoaded(true);
      }
    };
    loadPlants();
  }, []);

  // Load care history
  useEffect(() => {
    const params = {};
    if (selectedPlantId) params.plant_id = selectedPlantId;
    fetchActions(params);
  }, [selectedPlantId, fetchActions]);

  const handleFilterChange = useCallback((e) => {
    setSelectedPlantId(e.target.value);
  }, []);

  const handleLoadMore = useCallback(() => {
    const params = {};
    if (selectedPlantId) params.plant_id = selectedPlantId;
    loadMore(params);
  }, [selectedPlantId, loadMore]);

  const handleClearFilter = useCallback(() => {
    setSelectedPlantId('');
  }, []);

  const selectedPlantName = selectedPlantId
    ? plantList.find(p => p.id === selectedPlantId)?.name || ''
    : '';

  const totalActions = pagination?.total ?? 0;

  // Loading state
  if (loading) {
    return (
      <div className="care-history-page">
        <h1 className="care-history-title">Care History</h1>
        <p className="care-history-subtitle">A record of every care action you've taken for your plants.</p>
        <div className="care-history-filter-bar">
          <select disabled className="care-history-filter-select" style={{ opacity: 0.5 }}>
            <option>All plants</option>
          </select>
        </div>
        <div aria-busy="true" aria-label="Loading care history" className="care-history-skeleton-list">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="care-history-skeleton-row">
              <div className="skeleton skeleton-circle" />
              <div className="skeleton-text-group">
                <div className="skeleton skeleton-line" style={{ width: `${35 + Math.random() * 15}%` }} />
                <div className="skeleton skeleton-line-sm" style={{ width: `${20 + Math.random() * 10}%`, marginTop: 6 }} />
              </div>
              <div className="skeleton skeleton-timestamp" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="care-history-page">
        <h1 className="care-history-title">Care History</h1>
        <p className="care-history-subtitle">A record of every care action you've taken for your plants.</p>
        <div className="care-history-centered-state">
          <WarningCircle size={48} color="#B85C38" />
          <h2 className="care-history-state-heading">Couldn't load your care history.</h2>
          <p className="care-history-state-body">Something went wrong. Please try again.</p>
          <Button
            variant="secondary"
            onClick={() => {
              const params = {};
              if (selectedPlantId) params.plant_id = selectedPlantId;
              fetchActions(params);
            }}
            aria-label="Retry loading care history"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state — no filter active
  if (totalActions === 0 && !selectedPlantId) {
    return (
      <div className="care-history-page">
        <h1 className="care-history-title">Care History</h1>
        <p className="care-history-subtitle">A record of every care action you've taken for your plants.</p>
        <div className="care-history-centered-state">
          <div className="care-history-empty-illustration" aria-hidden="true">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="70" r="24" fill="#E0DDD6" />
              <path d="M50 20 C50 20, 30 40, 50 55 C70 40, 50 20, 50 20Z" fill="#5C7A5C" />
              <path d="M50 55 L50 75" stroke="#A67C5B" strokeWidth="3" strokeLinecap="round" />
              <circle cx="35" cy="35" r="4" fill="#5B8FA8" opacity="0.6" />
              <circle cx="62" cy="28" r="3" fill="#5B8FA8" opacity="0.4" />
              <circle cx="42" cy="22" r="2.5" fill="#5B8FA8" opacity="0.5" />
            </svg>
          </div>
          <h2 className="care-history-state-heading">No care actions yet.</h2>
          <p className="care-history-state-body">Start by marking a plant as watered!</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to my plants
          </Button>
        </div>
      </div>
    );
  }

  // Filtered empty state
  if (totalActions === 0 && selectedPlantId) {
    return (
      <div className="care-history-page">
        <h1 className="care-history-title">Care History</h1>
        <p className="care-history-subtitle">A record of every care action you've taken for your plants.</p>
        <div className="care-history-filter-bar">
          <label className="care-history-filter-label" htmlFor="plant-filter">Filter by plant:</label>
          <select
            id="plant-filter"
            className="care-history-filter-select"
            value={selectedPlantId}
            onChange={handleFilterChange}
          >
            <option value="">All plants</option>
            {plantList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="care-history-centered-state">
          <h2 className="care-history-state-heading care-history-state-heading--filtered">No actions for this plant yet.</h2>
          <p className="care-history-state-body">Try a different plant, or head to its page to mark a care action.</p>
          <Button variant="ghost" onClick={handleClearFilter}>
            Clear filter
          </Button>
        </div>
      </div>
    );
  }

  // Populated state
  return (
    <div className="care-history-page">
      <h1 className="care-history-title">Care History</h1>
      <p className="care-history-subtitle">A record of every care action you've taken for your plants.</p>

      <div className="care-history-filter-bar">
        <span className="care-history-result-count">
          {totalActions} action{totalActions !== 1 ? 's' : ''}
          {selectedPlantName ? ` for ${selectedPlantName}` : ''}
        </span>
        <div className="care-history-filter-group">
          <label className="care-history-filter-label" htmlFor="plant-filter">Filter by plant:</label>
          <select
            id="plant-filter"
            className="care-history-filter-select"
            value={selectedPlantId}
            onChange={handleFilterChange}
          >
            <option value="">All plants</option>
            {plantList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="care-history-list" role="list">
        {actions.map((action, index) => {
          const config = CARE_TYPE_CONFIG[action.care_type] || CARE_TYPE_CONFIG.watering;
          const Icon = config.icon;
          const fullDate = formatFullDateTime(action.performed_at);

          return (
            <div key={action.id} className="care-history-item" role="listitem">
              <div
                className="care-history-icon-circle"
                style={{ background: config.bgColor }}
                aria-hidden="true"
              >
                <Icon size={20} color={config.iconColor} />
              </div>
              <div className="care-history-item-info">
                <span className="care-history-plant-name">{action.plant_name}</span>
                <span className="care-history-action-label">{config.label}</span>
              </div>
              <span
                className="care-history-timestamp"
                title={fullDate}
                aria-label={`Performed on ${fullDate}`}
              >
                {formatRelativeTime(action.performed_at)}
              </span>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="care-history-load-more">
          <Button
            variant="ghost"
            onClick={handleLoadMore}
            loading={loadingMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : `Load more (${remaining} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
}
