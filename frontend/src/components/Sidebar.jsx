import { NavLink, useNavigate } from 'react-router-dom';
import { Plant, User, SignOut, List, X, ClockCounterClockwise, BellSimple } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth.jsx';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose, careDueBadge = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const badgeDisplay = careDueBadge >= 100 ? '99+' : String(careDueBadge);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-logo" onClick={onClose}>
            <Plant size={24} weight="fill" color="#5C7A5C" />
            <span>Plant Guardians</span>
          </NavLink>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Plant size={20} />
            <span>My Plants</span>
          </NavLink>
          <NavLink
            to="/due"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <BellSimple size={20} />
            <span>Care Due</span>
            {careDueBadge > 0 && (
              <span
                className="sidebar-badge"
                aria-label={`${careDueBadge} plant${careDueBadge !== 1 ? 's' : ''} overdue or due today`}
              >
                {badgeDisplay}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <ClockCounterClockwise size={20} />
            <span>History</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user?.full_name)}</div>
            <span className="sidebar-username">{user?.full_name || 'User'}</span>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <SignOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
