import './StatusBadge.css';

export default function StatusBadge({ status, daysOverdue, careType }) {
  const getLabel = () => {
    switch (status) {
      case 'on_track':
        return 'On Track';
      case 'due_today':
        return 'Due Today';
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

  return (
    <span
      className={`status-badge status-badge-${statusClass}`}
      title={careType ? `${careType}: ${getLabel()}` : getLabel()}
    >
      {getLabel()}
    </span>
  );
}
