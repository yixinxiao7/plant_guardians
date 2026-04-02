import { Plant } from '@phosphor-icons/react';
import { formatRelativeTime, formatFullDateTime } from '../utils/formatDate.js';
import './PlantFrequencyTable.css';

export default function PlantFrequencyTable({ plants = [] }) {
  if (plants.length === 0) return null;

  const maxCount = plants[0]?.count || 1;

  return (
    <div className="plant-freq-container">
      <h3 className="plant-freq-heading">Care by Plant</h3>
      <div className="plant-freq-card">
        <div className="plant-freq-scroll">
          <table className="plant-freq-table" aria-label="Care frequency by plant">
            <thead>
              <tr>
                <th scope="col" className="plant-freq-th">Plant Name</th>
                <th scope="col" className="plant-freq-th plant-freq-th-last-cared">Last Cared For</th>
                <th scope="col" className="plant-freq-th">Total Actions</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((plant, i) => {
                const barWidth = `${(plant.count / maxCount) * 100}%`;
                return (
                  <tr key={plant.plant_id} className={i < plants.length - 1 ? 'plant-freq-row-bordered' : ''}>
                    <td className="plant-freq-td plant-freq-name">
                      <Plant size={12} color="var(--color-accent-primary)" aria-hidden="true" />
                      <span>{plant.plant_name}</span>
                    </td>
                    <td className="plant-freq-td plant-freq-last-cared">
                      <time
                        dateTime={plant.last_action_at}
                        title={formatFullDateTime(plant.last_action_at)}
                      >
                        {formatRelativeTime(plant.last_action_at)}
                      </time>
                    </td>
                    <td className="plant-freq-td plant-freq-actions">
                      <span className="plant-freq-count">{plant.count}</span>
                      <div className="plant-freq-bar-track" aria-hidden="true">
                        <div className="plant-freq-bar-fill" style={{ width: barWidth }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
