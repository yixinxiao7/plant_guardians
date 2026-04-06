import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  WarningCircle,
  Clock,
  CalendarBlank,
  Drop,
  Leaf,
  PottedPlant,
  CheckCircle,
} from '@phosphor-icons/react';
import { useCareDue } from '../hooks/useCareDue.js';
import { useToast } from '../hooks/useToast.jsx';
import { careActions } from '../utils/api.js';
import Button from '../components/Button.jsx';
import BatchActionBar from '../components/BatchActionBar.jsx';
import CareNoteInput from '../components/CareNoteInput.jsx';
import './CareDuePage.css';

const CARE_TYPE_CONFIG = {
  watering: {
    icon: Drop,
    label: 'Watering',
    bgColor: 'var(--color-care-watering-bg)',
    iconColor: 'var(--color-care-watering-icon)',
  },
  fertilizing: {
    icon: Leaf,
    label: 'Fertilizing',
    bgColor: 'var(--color-care-fertilizing-bg)',
    iconColor: 'var(--color-care-fertilizing-icon)',
  },
  repotting: {
    icon: PottedPlant,
    label: 'Repotting',
    bgColor: 'var(--color-care-repotting-bg)',
    iconColor: 'var(--color-care-repotting-icon)',
  },
};

const SECTION_CONFIG = {
  overdue: {
    icon: WarningCircle,
    title: 'OVERDUE',
    color: 'var(--color-status-overdue-text)',
    pillBg: 'var(--color-status-overdue-bg)',
    emptyText: 'Nothing overdue — great work! 🌱',
  },
  due_today: {
    icon: Clock,
    title: 'DUE TODAY',
    color: 'var(--color-status-due-today-text)',
    pillBg: 'var(--color-status-due-today-bg)',
    emptyText: 'Nothing due today.',
  },
  upcoming: {
    icon: CalendarBlank,
    title: 'COMING UP',
    color: 'var(--color-status-on-track-text)',
    pillBg: 'var(--color-status-on-track-bg)',
    emptyText: 'No upcoming care in the next 7 days.',
  },
};

const SECTION_ORDER = ['overdue', 'due_today', 'upcoming'];

/**
 * Determine the next focus target after an item is removed from a section.
 */
function getNextFocusTarget(removedItemKey, removedSectionKey, removedIndex, postRemovalData, buttonRefs) {
  const sectionItems = postRemovalData[removedSectionKey] || [];

  if (sectionItems.length > 0) {
    const targetIdx = Math.min(removedIndex, sectionItems.length - 1);
    const targetItem = sectionItems[targetIdx];
    const key = `${targetItem.plant_id}__${targetItem.care_type}`;
    const btn = buttonRefs[key];
    if (btn) return btn;
  }

  const currentIdx = SECTION_ORDER.indexOf(removedSectionKey);
  for (let i = currentIdx + 1; i < SECTION_ORDER.length; i++) {
    const items = postRemovalData[SECTION_ORDER[i]] || [];
    if (items.length > 0) {
      const key = `${items[0].plant_id}__${items[0].care_type}`;
      const btn = buttonRefs[key];
      if (btn) return btn;
    }
  }

  for (let i = 0; i < currentIdx; i++) {
    const items = postRemovalData[SECTION_ORDER[i]] || [];
    if (items.length > 0) {
      const key = `${items[0].plant_id}__${items[0].care_type}`;
      const btn = buttonRefs[key];
      if (btn) return btn;
    }
  }

  return null;
}

function getUrgencyText(sectionKey, item) {
  if (sectionKey === 'overdue') {
    if (item.last_done_at === null) return 'Never done';
    return `${item.days_overdue} day${item.days_overdue === 1 ? '' : 's'} overdue`;
  }
  if (sectionKey === 'due_today') {
    return 'Due today';
  }
  if (sectionKey === 'upcoming') {
    if (item.due_in_days === 1) return 'Due tomorrow';
    return `Due in ${item.due_in_days} days`;
  }
  return '';
}

function getUrgencyColor(sectionKey) {
  if (sectionKey === 'overdue') return 'var(--color-status-overdue-text)';
  if (sectionKey === 'due_today') return 'var(--color-status-due-today-text)';
  return 'var(--color-status-on-track-text)';
}

function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Build a unique key for a care item.
 */
function itemKey(item) {
  return `${item.plant_id}-${item.care_type}`;
}

function refKey(item) {
  return `${item.plant_id}__${item.care_type}`;
}

/**
 * Get all visible items across all sections as a flat array with section info.
 */
function getAllItems(data) {
  if (!data) return [];
  const items = [];
  for (const sectionKey of SECTION_ORDER) {
    const sectionItems = data[sectionKey] || [];
    for (const item of sectionItems) {
      items.push({ ...item, _sectionKey: sectionKey });
    }
  }
  return items;
}

export default function CareDuePage() {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const onBadgeUpdate = outletContext.onBadgeUpdate;
  const { data, loading, error, badgeCount, fetchCareDue, markDone } = useCareDue();
  const { addToast } = useToast();
  const [markingItems, setMarkingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());
  const [liveMessage, setLiveMessage] = useState('');
  const [noteValues, setNoteValues] = useState({});
  const markDoneButtonRefs = useRef({});
  const viewMyPlantsButtonRef = useRef(null);
  const cardRefs = useRef({});

  // Batch selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [batchBarState, setBatchBarState] = useState('idle'); // idle | confirm | loading | partial-failure
  const [batchResult, setBatchResult] = useState(null); // { successCount, failCount, totalAttempted, failedActions }
  const selectAllRef = useRef(null);
  const selectButtonRef = useRef(null);

  useEffect(() => {
    fetchCareDue();
  }, [fetchCareDue]);

  // Update badge count in parent (sidebar)
  useEffect(() => {
    if (onBadgeUpdate) {
      onBadgeUpdate(badgeCount);
    }
  }, [badgeCount, onBadgeUpdate]);

  // Update live region for screen readers
  useEffect(() => {
    if (!loading && data) {
      setLiveMessage('Care due items loaded.');
    }
  }, [loading, data]);

  // Compute all visible items for selection
  const allItems = data ? getAllItems(data) : [];
  const allItemKeys = new Set(allItems.map(itemKey));
  const selectedCount = selectedItems.size;
  const allSelected = allItems.length > 0 && selectedCount === allItems.length;
  const someSelected = selectedCount > 0 && selectedCount < allItems.length;

  // Enter selection mode
  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setSelectedItems(new Set());
    setBatchBarState('idle');
    setBatchResult(null);
    // Focus select-all checkbox after render
    requestAnimationFrame(() => {
      if (selectAllRef.current) selectAllRef.current.focus();
    });
  }, []);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedItems(new Set());
    setBatchBarState('idle');
    setBatchResult(null);
    // Return focus to Select button
    requestAnimationFrame(() => {
      if (selectButtonRef.current) selectButtonRef.current.focus();
    });
  }, []);

  // Toggle individual item
  const toggleItem = useCallback((item) => {
    const key = itemKey(item);
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Select all / deselect all
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItems.map(itemKey)));
    }
  }, [allSelected, allItems]);

  // Build actions array for the batch API call
  const buildBatchActions = useCallback((itemKeysToSend) => {
    const now = new Date().toISOString();
    return allItems
      .filter((item) => itemKeysToSend.has(itemKey(item)))
      .map((item) => ({
        plant_id: item.plant_id,
        care_type: item.care_type,
        performed_at: now,
      }));
  }, [allItems]);

  // Handle "Mark done" click → show confirmation
  const handleBatchMarkDone = useCallback(() => {
    setBatchBarState('confirm');
  }, []);

  // Handle confirm → fire API call
  const handleBatchConfirm = useCallback(async () => {
    setBatchBarState('loading');
    const keysToSend = new Set(selectedItems);
    const actions = buildBatchActions(keysToSend);

    try {
      const result = await careActions.batch(actions);
      const { results, created_count, error_count } = result;

      if (error_count === 0) {
        // Full success — remove all selected items from data
        const keysToRemove = new Set(actions.map((a) => `${a.plant_id}-${a.care_type}`));
        setRemovingItems((prev) => new Set([...prev, ...keysToRemove]));

        // Wait for animation, then update data
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const delay = prefersReducedMotion ? 0 : 300;

        setTimeout(() => {
          // Optimistic local removal via re-fetch approach
          // Remove from local data directly
          if (data) {
            const removeFromSection = (items) =>
              items.filter((item) => !keysToRemove.has(itemKey(item)));
            // Trigger re-render by calling fetchCareDue
          }
          fetchCareDue();
          setRemovingItems(new Set());
          exitSelectionMode();
          addToast(`${created_count} care ${created_count === 1 ? 'action' : 'actions'} marked done`, 'success');
        }, delay);
      } else if (created_count > 0) {
        // Partial failure
        const successKeys = new Set();
        const failedActions = [];
        results.forEach((r) => {
          const key = `${r.plant_id}-${r.care_type}`;
          if (r.status === 'created') {
            successKeys.add(key);
          } else {
            failedActions.push(r);
          }
        });

        // Remove successful items with animation
        setRemovingItems((prev) => new Set([...prev, ...successKeys]));

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const delay = prefersReducedMotion ? 0 : 300;

        setTimeout(() => {
          fetchCareDue();
          setRemovingItems(new Set());
          // Keep only failed items selected
          const failedKeys = new Set(failedActions.map((r) => `${r.plant_id}-${r.care_type}`));
          setSelectedItems(failedKeys);
          setBatchBarState('partial-failure');
          setBatchResult({
            successCount: created_count,
            failCount: error_count,
            totalAttempted: results.length,
            failedActions,
          });
        }, delay);
      } else {
        // All failed
        setBatchBarState('partial-failure');
        const failedActions = results.filter((r) => r.status === 'error');
        setBatchResult({
          successCount: 0,
          failCount: error_count,
          totalAttempted: results.length,
          failedActions,
        });
      }
    } catch {
      addToast('Something went wrong. Please try again.', 'error');
      setBatchBarState('idle');
    }
  }, [selectedItems, buildBatchActions, data, fetchCareDue, exitSelectionMode, addToast]);

  // Handle retry — send only failed items
  const handleBatchRetry = useCallback(() => {
    // Re-enter confirmation flow with only failed items selected
    setBatchBarState('confirm');
  }, []);

  // Handle cancel inside action bar (returns to idle, keeps selections)
  const handleBatchBarCancel = useCallback(() => {
    setBatchBarState('idle');
  }, []);

  const handleMarkDone = useCallback(
    async (item, sectionKey) => {
      const ik = itemKey(item);
      const rk = refKey(item);
      setMarkingItems((prev) => new Set(prev).add(ik));
      setLiveMessage('');

      try {
        const noteText = noteValues[ik] || null;
        const trimmedNote = noteText ? noteText.trim() : null;
        await markDone(item.plant_id, item.care_type, trimmedNote || null);
        const careLabel = CARE_TYPE_CONFIG[item.care_type]?.label?.toLowerCase() || item.care_type;
        addToast(`${item.plant_name} ${careLabel} marked as done! 🌿`, 'success');
        setLiveMessage(`${item.plant_name} ${careLabel} marked as done.`);

        // Compute post-removal data for focus target calculation
        const postRemovalData = data ? {
          overdue: data.overdue.filter((i) => !(i.plant_id === item.plant_id && i.care_type === item.care_type)),
          due_today: data.due_today.filter((i) => !(i.plant_id === item.plant_id && i.care_type === item.care_type)),
          upcoming: data.upcoming.filter((i) => !(i.plant_id === item.plant_id && i.care_type === item.care_type)),
        } : null;

        const originalSection = data[sectionKey] || [];
        const removedIndex = originalSection.findIndex(
          (i) => i.plant_id === item.plant_id && i.care_type === item.care_type
        );

        const focusTarget = postRemovalData
          ? getNextFocusTarget(rk, sectionKey, removedIndex, postRemovalData, markDoneButtonRefs.current)
          : null;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setRemovingItems((prev) => new Set(prev).add(ik));

        const moveFocus = () => {
          delete markDoneButtonRefs.current[rk];
          delete cardRefs.current[rk];

          setRemovingItems((prev) => {
            const next = new Set(prev);
            next.delete(ik);
            return next;
          });

          if (focusTarget && document.contains(focusTarget)) {
            focusTarget.focus();
          } else {
            requestAnimationFrame(() => {
              if (viewMyPlantsButtonRef.current) {
                viewMyPlantsButtonRef.current.focus();
              }
            });
          }
        };

        if (prefersReducedMotion) {
          moveFocus();
        } else {
          const cardEl = cardRefs.current[rk];
          if (cardEl) {
            const onTransitionEnd = (e) => {
              if (e.target === cardEl) {
                cardEl.removeEventListener('transitionend', onTransitionEnd);
                moveFocus();
              }
            };
            cardEl.addEventListener('transitionend', onTransitionEnd);
            setTimeout(() => {
              cardEl.removeEventListener('transitionend', onTransitionEnd);
              moveFocus();
            }, 350);
          } else {
            setTimeout(moveFocus, 350);
          }
        }
      } catch {
        addToast("Couldn't mark as done. Please try again.", 'error');
        setLiveMessage('Could not mark as done. Please try again.');
      } finally {
        setMarkingItems((prev) => {
          const next = new Set(prev);
          next.delete(ik);
          return next;
        });
      }
    },
    [markDone, addToast, data, noteValues]
  );

  const isAllClear =
    data &&
    data.overdue.length === 0 &&
    data.due_today.length === 0 &&
    data.upcoming.length === 0;

  const hasItems = data && !isAllClear;

  // Loading state
  if (loading) {
    return (
      <div className="care-due-page">
        <h1 className="care-due-title">Care Due</h1>
        <p className="care-due-subtitle">Plants that need your attention, sorted by urgency.</p>
        <div aria-busy="true" aria-label="Loading care due items" className="care-due-skeletons">
          {[0, 1].map((sectionIdx) => (
            <div key={sectionIdx} className="care-due-skeleton-section">
              <div className="skeleton care-due-skeleton-header" />
              {[0, 1, sectionIdx === 0 ? 2 : null].filter(Boolean).map((cardIdx) => (
                <div key={cardIdx} className="care-due-skeleton-card">
                  <div className="skeleton care-due-skeleton-circle" />
                  <div className="care-due-skeleton-text">
                    <div className="skeleton care-due-skeleton-line" style={{ width: `${40 + cardIdx * 10}%` }} />
                    <div className="skeleton care-due-skeleton-line-sm" style={{ width: `${25 + cardIdx * 5}%`, marginTop: 6 }} />
                    <div className="skeleton care-due-skeleton-line-xs" style={{ width: 80, marginTop: 6 }} />
                  </div>
                  <div className="skeleton care-due-skeleton-btn" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div aria-live="polite" className="sr-only">Loading care due items...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="care-due-page">
        <h1 className="care-due-title">Care Due</h1>
        <p className="care-due-subtitle">Plants that need your attention, sorted by urgency.</p>
        <div className="care-due-centered-state">
          <WarningCircle size={48} color="var(--color-status-overdue-text)" />
          <h2 className="care-due-state-heading care-due-state-heading--error">
            Couldn't load your care schedule.
          </h2>
          <p className="care-due-state-body">Something went wrong. Please try again.</p>
          <Button
            variant="secondary"
            onClick={fetchCareDue}
            aria-label="Retry loading care due items"
            style={{ marginTop: 24 }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Global all-clear state
  if (isAllClear) {
    return (
      <div className="care-due-page">
        <h1 className="care-due-title">Care Due</h1>
        <p className="care-due-subtitle">Plants that need your attention, sorted by urgency.</p>
        <div className="care-due-centered-state care-due-all-clear">
          <div aria-hidden="true" className="care-due-all-clear-illustration">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="85" r="28" fill="#E8F4EC" />
              <path d="M60 20 C60 20, 35 45, 60 65 C85 45, 60 20, 60 20Z" fill="#5C7A5C" />
              <path d="M60 65 L60 90" stroke="#A67C5B" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="42" cy="30" r="3" fill="#5C7A5C" opacity="0.4" />
              <circle cx="78" cy="35" r="2.5" fill="#5C7A5C" opacity="0.3" />
              <path d="M47 18 L49 14 L51 18" stroke="#A67C5B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              <path d="M72 22 L74 18 L76 22" stroke="#A67C5B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              <circle cx="53" cy="12" r="1.5" fill="#5C7A5C" opacity="0.5" />
              <path d="M84 28 L86 25" stroke="#5C7A5C" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              <path d="M84 25 L87 28" stroke="#5C7A5C" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            </svg>
          </div>
          <h2 className="care-due-all-clear-heading">All your plants are happy!</h2>
          <p className="care-due-all-clear-body">
            You're all caught up. Check back later or explore your plant inventory.
          </p>
          <Button
            ref={viewMyPlantsButtonRef}
            variant="primary"
            onClick={() => navigate('/')}
            style={{ marginTop: 28 }}
          >
            View my plants
          </Button>
        </div>
      </div>
    );
  }

  // Populated state — render sections
  const sections = [
    { key: 'overdue', items: data.overdue },
    { key: 'due_today', items: data.due_today },
    { key: 'upcoming', items: data.upcoming },
  ];

  return (
    <div className={`care-due-page ${selectionMode ? 'care-due-page--selection-mode' : ''}`}>
      {/* Header row */}
      <div className="care-due-header-row">
        {selectionMode && (
          <label className="care-due-select-all">
            <input
              type="checkbox"
              className="care-due-select-all-checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              aria-label="Select all care items"
              aria-checked={allSelected ? 'true' : someSelected ? 'mixed' : 'false'}
              ref={(el) => {
                selectAllRef.current = el;
                if (el) el.indeterminate = someSelected;
              }}
            />
            <span className="care-due-select-all-label">Select all</span>
          </label>
        )}
        <h1 className="care-due-title">Care Due</h1>
        {hasItems && (
          selectionMode ? (
            <Button
              variant="ghost"
              className="care-due-mode-btn"
              onClick={exitSelectionMode}
            >
              Cancel
            </Button>
          ) : (
            <Button
              ref={selectButtonRef}
              variant="ghost"
              className="care-due-mode-btn"
              onClick={enterSelectionMode}
            >
              Select
            </Button>
          )
        )}
      </div>
      <p className="care-due-subtitle">Plants that need your attention, sorted by urgency.</p>

      <div aria-live="polite" className="sr-only">{liveMessage}</div>

      {sections.map(({ key, items }) => {
        const config = SECTION_CONFIG[key];
        const SectionIcon = config.icon;
        const sectionId = `care-due-section-${key}`;

        return (
          <section key={key} aria-labelledby={sectionId} className="care-due-section">
            <div className="care-due-section-header">
              <SectionIcon size={16} color={config.color} aria-hidden="true" />
              <h2 id={sectionId} className="care-due-section-title" style={{ color: config.color }}>
                {config.title}
              </h2>
              <span
                className="care-due-section-count"
                style={{ background: config.pillBg, color: config.color }}
              >
                {items.length}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="care-due-section-empty">
                <p>{config.emptyText}</p>
              </div>
            ) : (
              <ul className="care-due-item-list">
                {items.map((item) => {
                  const ik = itemKey(item);
                  const rk = refKey(item);
                  const careConfig = CARE_TYPE_CONFIG[item.care_type] || CARE_TYPE_CONFIG.watering;
                  const CareIcon = careConfig.icon;
                  const isMarking = markingItems.has(ik);
                  const isRemoving = removingItems.has(ik);
                  const isSelected = selectedItems.has(ik);
                  const urgencyText = getUrgencyText(key, item);
                  const urgencyColor = getUrgencyColor(key);
                  const tooltip =
                    key === 'upcoming' && item.due_date
                      ? `Due ${formatDueDate(item.due_date)}`
                      : undefined;

                  const cardClasses = [
                    'care-due-card',
                    isRemoving ? 'care-due-card--removing' : '',
                    selectionMode ? 'care-due-card--checkable' : '',
                    isSelected ? 'care-due-card--selected' : '',
                  ].filter(Boolean).join(' ');

                  const handleCardClick = () => {
                    if (selectionMode) {
                      toggleItem(item);
                    }
                  };

                  return (
                    <li
                      key={ik}
                      ref={(el) => { cardRefs.current[rk] = el; }}
                      className={cardClasses}
                      onClick={selectionMode ? handleCardClick : undefined}
                      role={selectionMode ? 'button' : undefined}
                      tabIndex={selectionMode ? 0 : undefined}
                      onKeyDown={selectionMode ? (e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          toggleItem(item);
                        }
                      } : undefined}
                    >
                      {selectionMode && (
                        <input
                          type="checkbox"
                          className="care-due-item-checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Mark ${item.plant_name} ${careConfig.label.toLowerCase()} as done`}
                        />
                      )}
                      <div
                        className="care-due-card-icon"
                        style={{ background: careConfig.bgColor }}
                        aria-hidden="true"
                      >
                        <CareIcon size={20} color={careConfig.iconColor} />
                      </div>
                      <div className="care-due-card-info">
                        <span className="care-due-card-plant-name">{item.plant_name}</span>
                        <span className="care-due-card-care-type">{careConfig.label}</span>
                        <span
                          className="care-due-card-urgency"
                          style={{ color: urgencyColor }}
                          title={tooltip}
                        >
                          {urgencyText}
                        </span>
                      </div>
                      {!selectionMode && (
                        <>
                          <button
                            ref={(el) => { markDoneButtonRefs.current[rk] = el; }}
                            className="care-due-mark-done-btn"
                            onClick={() => handleMarkDone(item, key)}
                            disabled={isMarking}
                            aria-busy={isMarking}
                            aria-label={`Mark ${item.plant_name} ${careConfig.label.toLowerCase()} as done`}
                          >
                            {isMarking ? (
                              <span className="care-due-mark-spinner" aria-label="Marking as done" />
                            ) : (
                              'Mark as done'
                            )}
                          </button>
                          <CareNoteInput
                            noteValue={noteValues[ik] || ''}
                            onNoteChange={(val) => setNoteValues(prev => ({ ...prev, [ik]: val }))}
                            plantId={item.plant_id}
                            careType={item.care_type}
                            plantName={item.plant_name}
                            disabled={isMarking}
                            idPrefix="note-input"
                          />
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {/* Batch action bar — only rendered in selection mode */}
      {selectionMode && (
        <BatchActionBar
          selectedCount={selectedCount}
          state={batchBarState}
          onMarkDone={handleBatchMarkDone}
          onConfirm={handleBatchConfirm}
          onCancel={handleBatchBarCancel}
          onRetry={handleBatchRetry}
          successCount={batchResult?.successCount || 0}
          failCount={batchResult?.failCount || 0}
          totalAttempted={batchResult?.totalAttempted || 0}
        />
      )}
    </div>
  );
}
