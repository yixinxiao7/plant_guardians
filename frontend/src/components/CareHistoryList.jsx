import CareHistoryItem from './CareHistoryItem.jsx';
import './CareHistorySection.css';

/**
 * Month-grouped list of care history items (SPEC-015).
 * Groups items by calendar month and renders month headers.
 */
function groupByMonth(items) {
  const groups = [];
  let currentMonth = null;
  let currentGroup = null;

  for (const item of items) {
    const date = new Date(item.performedAt);
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (monthKey !== currentMonth) {
      currentMonth = monthKey;
      currentGroup = { month: monthKey, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(item);
  }

  return groups;
}

export default function CareHistoryList({ items }) {
  const groups = groupByMonth(items);

  return (
    <div className="ch-list" role="list">
      {groups.map((group) => (
        <section key={group.month} className="ch-month-group" aria-labelledby={`ch-month-${group.month.replace(/\s+/g, '-')}`}>
          <div className="ch-month-header">
            <h2 id={`ch-month-${group.month.replace(/\s+/g, '-')}`} className="ch-month-label">
              {group.month}
            </h2>
            <hr className="ch-month-divider" />
          </div>
          {group.items.map((item) => (
            <CareHistoryItem key={item.id} item={item} />
          ))}
        </section>
      ))}
    </div>
  );
}
