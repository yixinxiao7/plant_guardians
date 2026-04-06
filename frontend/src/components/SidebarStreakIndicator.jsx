/**
 * SidebarStreakIndicator — compact streak pill for the sidebar (SPEC-014 / T-091).
 * Only rendered when currentStreak >= 1.
 */
import { useNavigate } from 'react-router-dom';
import { Plant, Fire } from '@phosphor-icons/react';
import './SidebarStreakIndicator.css';

export default function SidebarStreakIndicator({ currentStreak, onClick }) {
  const navigate = useNavigate();

  if (!currentStreak || currentStreak < 1) return null;

  const Icon = currentStreak >= 7 ? Fire : Plant;
  const iconColor = currentStreak >= 7
    ? 'var(--color-streak-icon-fire)'
    : 'var(--color-streak-icon-leaf)';

  const handleClick = () => {
    if (onClick) onClick();
    navigate('/profile');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="sidebar-streak-indicator"
      role="link"
      tabIndex={0}
      aria-label={`Care streak: ${currentStreak} days. Go to your profile.`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <Icon size={18} color={iconColor} aria-hidden="true" />
      <span className="sidebar-streak-count">{currentStreak}</span>
      <span className="sidebar-streak-text">day streak</span>
    </div>
  );
}
