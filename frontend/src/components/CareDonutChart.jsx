import './CareDonutChart.css';

const LIGHT_COLORS = {
  watering: '#5B8FA8',
  fertilizing: '#4A7C59',
  repotting: '#A67C5B',
};

const DARK_COLORS = {
  watering: '#4A7A96',
  fertilizing: '#6EB88A',
  repotting: '#C2956A',
};

function getColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function CareDonutChart({ byType = [], total = 0 }) {
  const colors = getColors();

  // Build SVG donut segments
  const radius = 110;
  const innerRadius = 75;
  const center = 140;
  const circumference = 2 * Math.PI * radius;

  let segments = [];
  let offset = 0;

  if (total > 0) {
    byType.forEach((entry) => {
      const pct = entry.count / total;
      const dashLength = pct * circumference;
      const gap = circumference - dashLength;
      segments.push({
        ...entry,
        color: colors[entry.care_type] || '#999',
        dasharray: `${dashLength} ${gap}`,
        dashoffset: -offset,
        pct: Math.round(pct * 100),
      });
      offset += dashLength;
    });
  }

  return (
    <div className="care-donut-container">
      <h3 className="care-donut-heading">Care by Type</h3>
      <div className="care-donut-card">
        <div className="care-donut-layout">
          <div className="care-donut-chart-wrapper" aria-hidden="true">
            <svg viewBox="0 0 280 280" width="280" height="280" className="care-donut-svg">
              {/* Background ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth={radius - innerRadius}
              />
              {/* Segments */}
              {segments.map((seg) => (
                <circle
                  key={seg.care_type}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={radius - innerRadius}
                  strokeDasharray={seg.dasharray}
                  strokeDashoffset={seg.dashoffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              ))}
              {/* Center text */}
              <text
                x={center}
                y={center - 6}
                textAnchor="middle"
                dominantBaseline="central"
                className="care-donut-center-value"
              >
                {total}
              </text>
              <text
                x={center}
                y={center + 18}
                textAnchor="middle"
                dominantBaseline="central"
                className="care-donut-center-label"
              >
                total
              </text>
            </svg>
          </div>

          {/* Custom Legend */}
          <ul className="care-donut-legend">
            {byType.map((entry) => (
              <li key={entry.care_type} className="care-donut-legend-row">
                <span
                  className="care-donut-legend-dot"
                  style={{ background: colors[entry.care_type] || '#999' }}
                />
                <span className="care-donut-legend-label">{capitalize(entry.care_type)}</span>
                <span className="care-donut-legend-count">{entry.count}</span>
                <span className="care-donut-legend-pct">
                  {total > 0 ? `(${Math.round((entry.count / total) * 100)}%)` : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Accessible data table for screen readers */}
        <table className="sr-only" aria-label="Care actions by type">
          <thead>
            <tr>
              <th>Care Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {byType.map((entry) => (
              <tr key={entry.care_type}>
                <td>{capitalize(entry.care_type)}</td>
                <td>{entry.count}</td>
                <td>{total > 0 ? `${Math.round((entry.count / total) * 100)}%` : '0%'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
