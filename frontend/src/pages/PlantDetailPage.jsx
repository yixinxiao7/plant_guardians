import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PencilSimple, TrashSimple, Leaf, Drop, PottedPlant } from '@phosphor-icons/react';
import { usePlantDetail } from '../hooks/usePlants.js';
import { useToast } from '../hooks/useToast.jsx';
import { plants as plantsApi } from '../utils/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import CareHistorySection from '../components/CareHistorySection.jsx';
import CareNoteInput from '../components/CareNoteInput.jsx';
import ShareStatusArea from '../components/ShareStatusArea.jsx';
import { formatDate, formatRelativeTime, formatDueDate } from '../utils/formatDate.js';
import './PlantDetailPage.css';

const CARE_ICONS = {
  watering: Drop,
  fertilizing: Leaf,
  repotting: PottedPlant,
};

const CARE_LABELS = {
  watering: 'Watering',
  fertilizing: 'Fertilizing',
  repotting: 'Repotting',
};

export default function PlantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { plant, loading, error, notFound, fetchPlant, markCareAsDone, undoCareAction } = usePlantDetail();

  const [activeTab, setActiveTab] = useState('overview');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markingDone, setMarkingDone] = useState({});
  const [doneStates, setDoneStates] = useState({});
  const [undoTimers, setUndoTimers] = useState({});
  const [noteValues, setNoteValues] = useState({});
  const timerRefs = useRef({});

  useEffect(() => {
    fetchPlant(id).catch(() => {});
  }, [id, fetchPlant]);

  // Cleanup undo timers
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, []);

  const handleMarkDone = useCallback(async (careType) => {
    setMarkingDone(prev => ({ ...prev, [careType]: true }));

    try {
      const noteText = noteValues[careType] || null;
      const trimmedNote = noteText ? noteText.trim() : null;
      const data = await markCareAsDone(id, careType, trimmedNote || null);
      const actionId = data.care_action?.id;

      // Trigger confetti
      try {
        const confetti = (await import('canvas-confetti')).default;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          const confettiColors = isDark
            ? ['#2D5A3D', '#D4A76A', '#C2956A', '#7EAF7E', '#B87A5A']
            : ['#5C7A5C', '#A67C5B', '#C4921F', '#4A7C59', '#D4A76A'];
          confetti({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.7 },
            colors: confettiColors,
          });
        }
      } catch {}

      setDoneStates(prev => ({ ...prev, [careType]: { actionId, done: true } }));

      addToast(`Great job! ${plant?.name} has been ${careType === 'watering' ? 'watered' : careType === 'fertilizing' ? 'fertilized' : 'repotted'}.`, 'success');

      // Start 10-second undo window
      const timer = setTimeout(() => {
        setDoneStates(prev => {
          const updated = { ...prev };
          delete updated[careType];
          return updated;
        });
        setUndoTimers(prev => {
          const updated = { ...prev };
          delete updated[careType];
          return updated;
        });
      }, 10000);

      timerRefs.current[careType] = timer;
      setUndoTimers(prev => ({ ...prev, [careType]: true }));
    } catch (err) {
      addToast(`Failed to mark ${careType} as done. Try again.`, 'error');
    } finally {
      setMarkingDone(prev => ({ ...prev, [careType]: false }));
    }
  }, [id, markCareAsDone, plant, addToast, noteValues]);

  const handleUndo = useCallback(async (careType) => {
    const state = doneStates[careType];
    if (!state?.actionId) return;

    // Clear the timer
    clearTimeout(timerRefs.current[careType]);
    delete timerRefs.current[careType];

    try {
      await undoCareAction(id, state.actionId);
      setDoneStates(prev => {
        const updated = { ...prev };
        delete updated[careType];
        return updated;
      });
      setUndoTimers(prev => {
        const updated = { ...prev };
        delete updated[careType];
        return updated;
      });
    } catch {
      addToast('Failed to undo. Try again.', 'error');
    }
  }, [id, doneStates, undoCareAction, addToast]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await plantsApi.delete(id);
      addToast(`${plant.name} has been removed.`, 'success');
      navigate('/');
    } catch {
      addToast('Failed to delete plant.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-header skeleton-header">
          <div className="skeleton detail-photo-skeleton" />
          <div className="detail-info-skeleton">
            <div className="skeleton" style={{ height: 36, width: 200 }} />
            <div className="skeleton" style={{ height: 18, width: 140, marginTop: 8 }} />
            <div className="skeleton" style={{ height: 14, width: 100, marginTop: 8 }} />
          </div>
        </div>
        <div className="detail-care-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="plant-not-found">
        <h2>This plant wasn't found.</h2>
        <p>It may have been removed.</p>
        <Button variant="primary" onClick={() => navigate('/')}>Back to Inventory</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plant-not-found">
        <p>Couldn't load plant details. Refresh to try again.</p>
        <Button variant="secondary" onClick={() => fetchPlant(id)}>Retry</Button>
      </div>
    );
  }

  if (!plant) return null;

  const orderedTypes = ['watering', 'fertilizing', 'repotting'];
  const scheduleMap = {};
  (plant.care_schedules || []).forEach(s => { scheduleMap[s.care_type] = s; });

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-photo-container">
          {plant.photo_url ? (
            <img src={plant.photo_url} alt={plant.name} className="detail-photo" />
          ) : (
            <div className="detail-photo-placeholder">
              <Leaf size={64} color="#B8CEB8" />
            </div>
          )}
        </div>
        <div className="detail-info">
          <h1 className="detail-name">{plant.name}</h1>
          {plant.type && <p className="detail-type">{plant.type}</p>}
          <p className="detail-date">Added {formatDate(plant.created_at)}</p>
          {plant.notes && (
            <div className="detail-notes">
              <label className="detail-notes-label">Notes</label>
              <p className="detail-notes-text">{plant.notes}</p>
            </div>
          )}
          <div className="detail-actions">
            <ShareStatusArea plantId={id} />
            <Button variant="secondary" onClick={() => navigate(`/plants/${id}/edit`)}>
              <PencilSimple size={16} /> Edit
            </Button>
            <Button variant="ghost" onClick={() => setDeleteModalOpen(true)} style={{ color: 'var(--color-status-red)' }}>
              <TrashSimple size={16} /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="plant-detail-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          aria-controls="panel-overview"
          className={`plant-detail-tab ${activeTab === 'overview' ? 'plant-detail-tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
          id="tab-overview"
        >
          Overview
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'history'}
          aria-controls="panel-history"
          className={`plant-detail-tab ${activeTab === 'history' ? 'plant-detail-tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
          id="tab-history"
        >
          History
        </button>
      </div>

      {/* Overview Tab Panel */}
      {activeTab === 'overview' && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
          {/* Care Schedule */}
          <section className="detail-care-section">
            <h2 className="detail-section-title">Care Schedule</h2>
            <div className="detail-care-grid">
              {orderedTypes.map(careType => {
                const schedule = scheduleMap[careType];
                const Icon = CARE_ICONS[careType];
                const isDone = doneStates[careType]?.done;
                const isMarking = markingDone[careType];
                const hasUndo = undoTimers[careType];

                if (!schedule) {
                  return (
                    <div key={careType} className="care-card care-card-empty" role="region" aria-label={`${CARE_LABELS[careType]} schedule`}>
                      <div className="care-card-header">
                        <span className="care-card-label"><Icon size={20} /> {CARE_LABELS[careType]}</span>
                        <StatusBadge status="not_set" />
                      </div>
                      <p className="care-card-frequency">Schedule not configured</p>
                      <button className="care-card-add-link" onClick={() => navigate(`/plants/${id}/edit`)}>
                        Add Schedule →
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={careType} className="care-card" role="region" aria-label={`${CARE_LABELS[careType]} schedule`}>
                    <div className="care-card-header">
                      <span className="care-card-label"><Icon size={20} /> {CARE_LABELS[careType]}</span>
                      <StatusBadge
                        status={isDone ? 'on_track' : schedule.status}
                        daysOverdue={schedule.days_overdue}
                      />
                    </div>
                    <p className="care-card-frequency">Every {schedule.frequency_value} {schedule.frequency_unit}</p>
                    <p className="care-card-last-done">
                      Last {careType === 'watering' ? 'watered' : careType === 'fertilizing' ? 'fertilized' : 'repotted'}:{' '}
                      {isDone ? 'Just now' : (schedule.last_done_at ? formatRelativeTime(schedule.last_done_at) : 'Never')}
                    </p>
                    <p className="care-card-next-due">
                      Next due: <span className={schedule.status === 'due_today' ? 'text-yellow' : ''}>{formatDueDate(schedule.next_due_at)}</span>
                    </p>

                    {isDone && hasUndo ? (
                      <button className={`care-done-btn care-done-success`} aria-label={`${CARE_LABELS[careType]} marked as done`}>
                        Done!
                      </button>
                    ) : null}

                    {!isDone && (
                      <>
                        <Button
                          variant="secondary"
                          fullWidth
                          loading={isMarking}
                          onClick={() => handleMarkDone(careType)}
                          aria-label={`Mark ${careType} as done for ${plant.name}`}
                          className="care-mark-btn"
                        >
                          Mark as done
                        </Button>
                        <CareNoteInput
                          noteValue={noteValues[careType] || ''}
                          onNoteChange={(val) => setNoteValues(prev => ({ ...prev, [careType]: val }))}
                          plantId={id}
                          careType={careType}
                          plantName={plant.name}
                          disabled={isMarking}
                          idPrefix="note-input-detail"
                        />
                      </>
                    )}

                    {hasUndo && (
                      <button className="care-undo-btn" onClick={() => handleUndo(careType)}>
                        Undo
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent Activity */}
          {plant.recent_care_actions && plant.recent_care_actions.length > 0 && (
            <section className="detail-activity">
              <h2 className="detail-section-title">Recent Activity</h2>
              <div className="activity-list">
                {plant.recent_care_actions.map(action => {
                  const Icon = CARE_ICONS[action.care_type] || Leaf;
                  return (
                    <div key={action.id} className="activity-item">
                      <Icon size={16} />
                      <span>You {action.care_type === 'watering' ? 'watered' : action.care_type === 'fertilizing' ? 'fertilized' : 'repotted'} {plant.name}</span>
                      <span className="activity-time">{formatRelativeTime(action.performed_at)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(!plant.recent_care_actions || plant.recent_care_actions.length === 0) && (
            <section className="detail-activity">
              <h2 className="detail-section-title">Recent Activity</h2>
              <p className="activity-empty">No care history yet.</p>
            </section>
          )}
        </div>
      )}

      {/* History Tab Panel */}
      {activeTab === 'history' && (
        <div id="panel-history" role="tabpanel" aria-labelledby="tab-history">
          <CareHistorySection
            plantId={id}
            onSwitchToOverview={() => setActiveTab('overview')}
          />
        </div>
      )}

      {/* Delete modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={`Remove ${plant.name}?`}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          This will permanently remove {plant.name} from your garden. This can't be undone.
        </p>
        <div className="delete-modal-actions">
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Yes, remove it</Button>
        </div>
      </Modal>

      {/* Live region */}
      <div aria-live="polite" className="sr-only" />
    </div>
  );
}
