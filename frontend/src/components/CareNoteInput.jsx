import { useState, useRef, useEffect } from 'react';
import { PencilSimple } from '@phosphor-icons/react';
import './CareNoteInput.css';

const CHAR_LIMIT = 280;
const COUNTER_VISIBLE_AT = 200;
const COUNTER_YELLOW_AT = 240;
const COUNTER_RED_AT = 270;

/**
 * Optional care note input with "+ Add note" toggle, textarea, and character counter.
 * Used in both CareDuePage and PlantDetailPage mark-done flows (SPEC-016 / T-098).
 *
 * @param {string} noteValue - Current note text
 * @param {function} onNoteChange - Callback when note text changes
 * @param {string} plantId - Plant identifier for unique IDs
 * @param {string} careType - Care type for unique IDs
 * @param {string} plantName - Plant name for aria-label
 * @param {boolean} disabled - Disable input during submission
 * @param {string} idPrefix - Prefix for element IDs ('note-input' or 'note-input-detail')
 */
export default function CareNoteInput({
  noteValue,
  onNoteChange,
  plantId,
  careType,
  plantName,
  disabled = false,
  idPrefix = 'note-input',
}) {
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef(null);

  const inputId = `${idPrefix}-${plantId}-${careType}`;
  const counterId = `note-counter-${plantId}-${careType}`;

  const charCount = noteValue.length;
  const showCounter = charCount >= COUNTER_VISIBLE_AT;

  const handleToggle = () => {
    if (expanded) {
      // Collapse — discard note
      setExpanded(false);
      onNoteChange('');
    } else {
      setExpanded(true);
    }
  };

  // Focus textarea when expanded
  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  const getCounterClass = () => {
    if (charCount >= COUNTER_RED_AT) return 'care-note-counter--red';
    if (charCount >= COUNTER_YELLOW_AT) return 'care-note-counter--yellow';
    return '';
  };

  // Only announce at specific thresholds
  const [lastAnnounced, setLastAnnounced] = useState(0);
  const announceThresholds = [COUNTER_VISIBLE_AT, COUNTER_YELLOW_AT, COUNTER_RED_AT, CHAR_LIMIT];

  useEffect(() => {
    const threshold = announceThresholds.find(t => charCount >= t && lastAnnounced < t);
    if (threshold) {
      setLastAnnounced(threshold);
    }
  }, [charCount, lastAnnounced]);

  return (
    <div className="care-note-input-wrapper">
      <button
        type="button"
        className="care-note-toggle"
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={expanded}
        aria-controls={inputId}
      >
        <PencilSimple size={12} />
        {expanded ? '− Remove note' : '+ Add note'}
      </button>

      {expanded && (
        <div className="care-note-textarea-wrapper">
          <textarea
            ref={textareaRef}
            id={inputId}
            className="care-note-textarea"
            value={noteValue}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={CHAR_LIMIT}
            rows={3}
            disabled={disabled}
            placeholder="e.g. 'Soil was very dry — gave extra water'"
            aria-label={`Care note for ${plantName} ${careType}`}
            aria-describedby={counterId}
            style={{ resize: 'none' }}
          />
          <span
            id={counterId}
            className={`care-note-counter ${getCounterClass()} ${showCounter ? 'care-note-counter--visible' : ''}`}
            aria-live="polite"
          >
            {showCounter ? `${charCount} / ${CHAR_LIMIT}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
