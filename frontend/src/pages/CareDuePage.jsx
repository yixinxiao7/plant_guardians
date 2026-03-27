import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  WarningCircle,
  Clock,
  CalendarBlank,
  Drop,
  Leaf,
  PottedPlant,
} from '@phosphor-icons/react';
import { useCareDue } from '../hooks/useCareDue.js';
import { useToast } from '../hooks/useToast.jsx';
import Button from '../components/Button.jsx';
import './CareDuePage.css';

const CARE_TYPE_CONFIG = {
  watering: {
    icon: Drop,
    label: 'Watering',
    bgColor: '#EBF4F7',
    iconColor: '#5B8FA8',
  },
  fertilizing: {
    icon: Leaf,
    label: 'Fertilizing',
    bgColor: '#E8F4EC',
    iconColor: '#4A7C59',
  },
  repotting: {
    icon: PottedPlant,
    label: 'Repotting',
    bgColor: '#F4EDE8',
    iconColor: '#A67C5B',
  },
};

const SECTION_CONFIG = {
  overdue: {
    icon: WarningCircle,
    title: 'OVERDUE',
    color: '#B85C38',
    pillBg: '#FAEAE4',
    emptyText: 'Nothing overdue — great work! 🌱',
  },
  due_today: {
    icon: Clock,
    title: 'DUE TODAY',
    color: '#C4921F',
    pillBg: '#FDF4E3',
    emptyText: 'Nothing due today.',
  },
  upcoming: {
    icon: CalendarBlank,
    title: 'COMING UP',
    color: '#5C7A5C',
    pillBg: '#E8F4EC',
    emptyText: 'No upcoming care in the next 7 days.',
  },
};

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
  if (sectionKey === 'overdue') return '#B85C38';
  if (sectionKey === 'due_today') return '#C4921F';
  return '#5C7A5C';
}

function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
  const nextFocusRef = useRef(null);

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

  const handleMarkDone = useCallback(
    async (item, sectionKey) => {
      const itemKey = `${item.plant_id}-${item.care_type}`;
      setMarkingItems((prev) => new Set(prev).add(itemKey));
      setLiveMessage('');

      try {
        await markDone(item.plant_id, item.care_type);
        const careLabel = CARE_TYPE_CONFIG[item.care_type]?.label?.toLowerCase() || item.care_type;
        addToast(`${item.plant_name} ${careLabel} marked as done! 🌿`, 'success');
        setLiveMessage(`${item.plant_name} ${careLabel} marked as done.`);

        // Animate removal
        setRemovingItems((prev) => new Set(prev).add(itemKey));
        setTimeout(() => {
          setRemovingItems((prev) => {
            const next = new Set(prev);
            next.delete(itemKey);
            return next;
          });
        }, 300);
      } catch {
        addToast("Couldn't mark as done. Please try again.", 'error');
        setLiveMessage('Could not mark as done. Please try again.');
      } finally {
        setMarkingItems((prev) => {
          const next = new Set(prev);
          next.delete(itemKey);
          return next;
        });
      }
    },
    [markDone, addToast]
  );

  const isAllClear =
    data &&
    data.overdue.length === 0 &&
    data.due_today.length === 0 &&
    data.upcoming.length === 0;

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
          <WarningCircle size={48} color="#B85C38" />
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
    <div className="care-due-page">
      <h1 className="care-due-title">Care Due</h1>
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
                  const itemKey = `${item.plant_id}-${item.care_type}`;
                  const careConfig = CARE_TYPE_CONFIG[item.care_type] || CARE_TYPE_CONFIG.watering;
                  const CareIcon = careConfig.icon;
                  const isMarking = markingItems.has(itemKey);
                  const isRemoving = removingItems.has(itemKey);
                  const urgencyText = getUrgencyText(key, item);
                  const urgencyColor = getUrgencyColor(key);
                  const tooltip =
                    key === 'upcoming' && item.due_date
                      ? `Due ${formatDueDate(item.due_date)}`
                      : undefined;

                  return (
                    <li
                      key={itemKey}
                      className={`care-due-card ${isRemoving ? 'care-due-card--removing' : ''}`}
                    >
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
                      <button
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
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
