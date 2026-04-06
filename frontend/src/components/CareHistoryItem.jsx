import { useState, useRef, useEffect } from 'react';
import { Drop, Leaf, PottedPlant, CaretDown, CaretUp } from '@phosphor-icons/react';
import { formatDate, formatFullDateTime } from '../utils/formatDate.js';
import './CareHistorySection.css';

const CARE_CONFIG = {
  watering: {
    Icon: Drop,
    label: 'Watering',
    iconColor: '#4A7C59',
    iconBg: '#E8F4EC',
    darkIconBg: '#1E3028',
  },
  fertilizing: {
    Icon: Leaf,
    label: 'Fertilizing',
    iconColor: '#A67C5B',
    iconBg: '#F5EDE4',
    darkIconBg: '#2E2018',
  },
  repotting: {
    Icon: PottedPlant,
    label: 'Repotting',
    iconColor: '#6B6B5F',
    iconBg: '#F0EDE6',
    darkIconBg: '#2A2A24',
  },
};

/**
 * Format a care-history relative date per SPEC-015 rules.
 */
function formatCareRelativeDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();

  // Compare calendar days in local time
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((todayStart - dateStart) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 6) return `${diffDays} days ago`;
  if (diffDays <= 13) return '1 week ago';
  if (diffDays <= 20) return '2 weeks ago';
  if (diffDays <= 27) return '3 weeks ago';

  // 28+ days: use absolute date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CareHistoryItem({ item }) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const noteTextRef = useRef(null);
  const config = CARE_CONFIG[item.careType] || CARE_CONFIG.watering;
  const { Icon, label, iconColor, iconBg } = config;

  const absoluteDate = formatDate(item.performedAt);
  const fullDateTime = formatFullDateTime(item.performedAt);
  const relativeDate = formatCareRelativeDate(item.performedAt);
  const hasNotes = item.notes != null && item.notes.trim() !== '';

  const ariaLabel = `${label} on ${absoluteDate}${hasNotes ? '. Includes note.' : ''}`;
  const noteTextId = `note-text-${item.id}`;

  // Check if note text overflows 2 lines
  useEffect(() => {
    if (hasNotes && noteTextRef.current) {
      const el = noteTextRef.current;
      setIsOverflowing(el.scrollHeight > el.clientHeight);
    }
  }, [hasNotes, item.notes]);

  return (
    <div className="ch-item" role="listitem" aria-label={ariaLabel} tabIndex={0}>
      <div className="ch-item-row">
        <div
          className={`ch-item-icon-circle ch-item-icon-circle--${item.careType}`}
          style={{ '--icon-bg': iconBg }}
          aria-hidden="true"
        >
          <Icon size={20} color={iconColor} />
        </div>

        <span className="ch-item-label">{label}</span>

        <time
          className="ch-item-date"
          dateTime={item.performedAt}
          title={fullDateTime}
        >
          {relativeDate}
        </time>
      </div>

      {hasNotes && (
        <div className="ch-item-note">
          <hr className="ch-item-note-divider" />
          <p
            ref={noteTextRef}
            id={noteTextId}
            className={`ch-item-note-text ${noteExpanded ? '' : 'ch-item-note-text--clamped'}`}
          >
            {item.notes}
          </p>
          {isOverflowing && (
            <button
              className="ch-item-show-more"
              onClick={() => setNoteExpanded(prev => !prev)}
              aria-expanded={noteExpanded}
              aria-controls={noteTextId}
            >
              {noteExpanded ? 'Show less' : 'Show more'}
              {noteExpanded ? (
                <CaretUp size={10} className="ch-item-show-more-caret" />
              ) : (
                <CaretDown size={10} className="ch-item-show-more-caret" />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
