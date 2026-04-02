import { Drop, Leaf, PottedPlant } from '@phosphor-icons/react';
import { formatRelativeTime, formatFullDateTime } from '../utils/formatDate.js';
import './RecentActivityFeed.css';

const CARE_ICONS = {
  watering: { Icon: Drop, bg: 'var(--activity-icon-watering-bg, #EBF4F7)', color: '#5B8FA8' },
  fertilizing: { Icon: Leaf, bg: 'var(--activity-icon-fertilizing-bg, #E8F4EC)', color: '#4A7C59' },
  repotting: { Icon: PottedPlant, bg: 'var(--activity-icon-repotting-bg, #F4EDE8)', color: '#A67C5B' },
};

const CARE_LABELS = {
  watering: 'Watered',
  fertilizing: 'Fertilized',
  repotting: 'Repotted',
};

export default function RecentActivityFeed({ activities = [] }) {
  return (
    <div className="activity-feed-container">
      <h3 className="activity-feed-heading">Recent Activity</h3>
      <div className="activity-feed-card">
        <ul className="activity-feed-list">
          {activities.map((activity, i) => {
            const config = CARE_ICONS[activity.care_type] || CARE_ICONS.watering;
            const { Icon } = config;
            return (
              <li
                key={`${activity.plant_name}-${activity.performed_at}-${i}`}
                className={`activity-feed-row ${i < activities.length - 1 ? 'activity-feed-row-bordered' : ''}`}
              >
                <span
                  className="activity-feed-icon"
                  style={{ background: config.bg }}
                  aria-hidden="true"
                >
                  <Icon size={15} color={config.color} />
                </span>
                <div className="activity-feed-info">
                  <span className="activity-feed-plant">{activity.plant_name}</span>
                  <span className="activity-feed-type">{CARE_LABELS[activity.care_type] || activity.care_type}</span>
                </div>
                <time
                  className="activity-feed-time"
                  dateTime={activity.performed_at}
                  title={formatFullDateTime(activity.performed_at)}
                >
                  {formatRelativeTime(activity.performed_at)}
                </time>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
