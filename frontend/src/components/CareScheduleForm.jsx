import { useState } from 'react';
import { Plus, CaretDown, CaretUp } from '@phosphor-icons/react';
import './CareScheduleForm.css';

export default function CareScheduleForm({
  careType,
  label,
  required = false,
  expanded: controlledExpanded,
  onExpand,
  frequency,
  onFrequencyChange,
  lastDoneAt,
  onLastDoneChange,
  errors = {},
  aiFilledFields = [],
}) {
  const [localExpanded, setLocalExpanded] = useState(required);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;

  const isAiFilled = (field) => aiFilledFields.includes(field);

  const handleExpand = () => {
    setLocalExpanded(true);
    if (onExpand) onExpand();
  };

  if (!required && !expanded) {
    return (
      <div className="care-schedule-section">
        <button
          type="button"
          className="care-schedule-toggle"
          onClick={handleExpand}
        >
          <Plus size={16} />
          <span>Add {label.toLowerCase()} schedule</span>
        </button>
      </div>
    );
  }

  return (
    <div className="care-schedule-section">
      <div className="care-schedule-header">
        <span className="care-schedule-label">
          {label}
          {required && <span className="care-required"> *</span>}
        </span>
        {!required && (
          <button
            type="button"
            className="care-schedule-collapse"
            onClick={() => {
              setLocalExpanded(false);
              onFrequencyChange({ value: '', unit: 'days' });
              onLastDoneChange('');
            }}
            aria-label={`Remove ${label} schedule`}
          >
            Remove
          </button>
        )}
      </div>

      <div className="care-schedule-fields">
        <div className="care-frequency-row">
          <span className="care-frequency-label">Every</span>
          <input
            type="number"
            className={`care-frequency-input ${errors.value ? 'input-error' : ''} ${isAiFilled('value') ? 'ai-filled' : ''}`}
            min={1}
            max={365}
            value={frequency?.value || ''}
            onChange={(e) => onFrequencyChange({ ...frequency, value: e.target.value })}
            placeholder="7"
            aria-label={`${label} frequency number`}
          />
          <select
            className={`care-frequency-select ${isAiFilled('unit') ? 'ai-filled' : ''}`}
            value={frequency?.unit || 'days'}
            onChange={(e) => onFrequencyChange({ ...frequency, unit: e.target.value })}
            aria-label={`${label} frequency unit`}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
        </div>
        {errors.value && <span className="care-error">{errors.value}</span>}
        {isAiFilled('value') && <span className="ai-badge">Filled by AI</span>}

        <div className="care-date-row">
          <label className="care-date-label" htmlFor={`${careType}-last-done`}>
            Last {careType === 'watering' ? 'watered' : careType === 'fertilizing' ? 'fertilized' : 'repotted'}
          </label>
          <input
            type="date"
            id={`${careType}-last-done`}
            className="care-date-input"
            value={lastDoneAt || ''}
            onChange={(e) => onLastDoneChange(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
    </div>
  );
}
