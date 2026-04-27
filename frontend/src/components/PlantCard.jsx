import { useNavigate } from 'react-router-dom';
import { PencilSimple, TrashSimple, Leaf } from '@phosphor-icons/react';
import StatusBadge from './StatusBadge.jsx';
import './PlantCard.css';

export default function PlantCard({ plant, onDelete }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/plants/${plant.id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/plants/${plant.id}/edit`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(plant);
  };

  // Determine status badges to show
  const schedules = plant.care_schedules || [];
  const orderedTypes = ['watering', 'fertilizing', 'repotting'];
  const sortedSchedules = orderedTypes
    .map(type => schedules.find(s => s.care_type === type))
    .filter(Boolean);

  return (
    <article
      className="plant-card"
      onClick={handleCardClick}
      role="article"
      aria-label={`${plant.name} plant card`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      <div className="plant-card-photo">
        {plant.photo_url ? (
          <img src={plant.photo_url} alt={plant.name} loading="lazy" decoding="async" />
        ) : (
          <div className="plant-card-placeholder">
            <Leaf size={48} color="#B8CEB8" />
          </div>
        )}
      </div>

      <div className="plant-card-body">
        <h3 className="plant-card-name">{plant.name}</h3>
        {plant.type && <p className="plant-card-type">{plant.type}</p>}
        <div className="plant-card-badges">
          {sortedSchedules.length > 0 ? (
            sortedSchedules.map(schedule => (
              <StatusBadge
                key={schedule.care_type}
                status={schedule.status}
                daysOverdue={schedule.days_overdue}
                careType={schedule.care_type}
              />
            ))
          ) : (
            <StatusBadge status="not_set" />
          )}
        </div>
      </div>

      <div className="plant-card-footer">
        <button
          className="plant-card-action"
          onClick={handleEdit}
          aria-label={`Edit ${plant.name}`}
        >
          <PencilSimple size={16} />
        </button>
        <button
          className="plant-card-action"
          onClick={handleDelete}
          aria-label={`Delete ${plant.name}`}
        >
          <TrashSimple size={16} />
        </button>
      </div>
    </article>
  );
}
