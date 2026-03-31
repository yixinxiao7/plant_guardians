import './StatTile.css';

export default function StatTile({ icon: Icon, iconColor, label, value, subLabel }) {
  const ariaLabel = `${value} ${label}`;

  return (
    <div className="stat-tile" role="figure" aria-label={ariaLabel}>
      <div className="stat-tile-label">
        {Icon && <Icon size={20} weight="regular" color={iconColor || 'var(--color-accent-primary)'} aria-hidden="true" />}
        <span>{label}</span>
      </div>
      <div className="stat-tile-value">{value}</div>
      <div className="stat-tile-sub">{subLabel}</div>
    </div>
  );
}
