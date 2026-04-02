import { Drop, Leaf, PottedPlant } from '@phosphor-icons/react';
import './StatusBadge.css';

const CARE_TYPE_CONFIG = {
  watering: {
    icon: Drop,
    label: 'Watering',
    iconColor: '#5B8FA8',
  },
  fertilizing: {
    icon: Leaf,
    label: 'Fertilizing',
    iconColor: '#4A7C59',
  },
  repotting: {
    icon: PottedPlant,
    label: 'Repotting',
    iconColor: '#A67C5B',
  },
};

export default function StatusBadge({ status, daysOverdue, careType }) {
  const getStatusText = () => {
    switch (status) {
      case 'on_track':
        return 'On track';
      case 'due_today':
        return 'Due today';
      case 'overdue':
        return daysOverdue ? `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue` : 'Overdue';
      case 'not_set':
        return 'Not set';
      default:
        return status;
    }
  };

  const statusClass = status === 'on_track' ? 'on-track'
    : status === 'due_today' ? 'due-today'
    : status === 'overdue' ? 'overdue'
    : 'not-set';

  const config = careType ? CARE_TYPE_CONFIG[careType] : null;
  const Icon = config?.icon;
  const statusText = getStatusText();
  const fullLabel = config ? `${config.label}: ${statusText}` : statusText;

  return (
    <span
      className={`status-badge status-badge-${statusClass}${config ? ' status-badge-with-icon' : ''}`}
      title={fullLabel}
    >
      {Icon && (
        <Icon
          size={13}
          weight="bold"
          color={config.iconColor}
          aria-hidden="true"
          className="status-badge-icon"
        />
      )}
      <span className="status-badge-label">{fullLabel}</span>
    </span>
  );
}
