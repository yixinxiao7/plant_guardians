import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plant, CalendarBlank, CheckCircle, SignOut, CaretRight } from '@phosphor-icons/react';
import { profile as profileApi, clearTokens } from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { useStreak } from '../hooks/useStreak.jsx';
import { formatMonthYear } from '../utils/formatDate.js';
import Button from '../components/Button.jsx';
import DeleteAccountModal from '../components/DeleteAccountModal.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import StreakTile from '../components/StreakTile.jsx';
import RemindersSection from '../components/RemindersSection.jsx';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { data: streakData, loading: streakLoading, error: streakError } = useStreak();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const deleteButtonRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileApi.get();
        setProfileData(data);
      } catch (err) {
        setError(err.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      addToast('Logout failed.', 'error');
      setLoggingOut(false);
    }
  };

  const handleConfirmDelete = async () => {
    // Called from the modal when user types DELETE and clicks confirm
    // If it throws, the modal catches it and shows inline error
    await profileApi.delete();

    // Success: clear everything and redirect
    await logout();
    navigate('/login?deleted=true', { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="profile-page">
        <h1 className="profile-title">My Profile</h1>
        <div className="profile-card">
          <div className="skeleton" style={{ width: 88, height: 88, borderRadius: '50%' }} />
          <div>
            <div className="skeleton" style={{ width: 180, height: 24, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 200, height: 16 }} />
          </div>
        </div>
        <div className="profile-stats">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profile-page">
        <h1 className="profile-title">My Profile</h1>
        <div className="profile-error">
          <p>Couldn't load your profile. Refresh to try again.</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const displayUser = profileData?.user || user;
  const stats = profileData?.stats || {};

  return (
    <div className="profile-page">
      <h1 className="profile-title">My Profile</h1>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar" role="img" aria-label={`${displayUser?.full_name} initials avatar`}>
          {getInitials(displayUser?.full_name)}
        </div>
        <div className="profile-details">
          <h2 className="profile-name">{displayUser?.full_name}</h2>
          <p className="profile-email">{displayUser?.email}</p>
          <p className="profile-member">
            <Plant size={14} /> Guardian since {formatMonthYear(displayUser?.created_at)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-tile" role="figure" aria-label={`${stats.plant_count || 0} Plants in care`}>
          <Plant size={32} color="var(--color-accent)" />
          <span className="stat-number">{stats.plant_count ?? 0}</span>
          <span className="stat-label">Plants in care</span>
        </div>
        <div className="stat-tile" role="figure" aria-label={`${stats.days_as_member || 0} Days as a Guardian`}>
          <CalendarBlank size={32} color="var(--color-accent)" />
          <span className="stat-number">{stats.days_as_member ?? 0}</span>
          <span className="stat-label">Days as a Guardian</span>
        </div>
        <div className="stat-tile" role="figure" aria-label={`${stats.total_care_actions || 0} Care actions completed`}>
          <CheckCircle size={32} color="var(--color-accent)" />
          <span className="stat-number">{stats.total_care_actions ?? 0}</span>
          <span className="stat-label">Care actions completed</span>
        </div>
      </div>

      {/* Care Streak (T-091) */}
      <StreakTile data={streakData} loading={streakLoading} error={streakError} />

      {/* Reminders (T-102) */}
      <RemindersSection />

      {/* Appearance */}
      <div className="profile-appearance-card">
        <ThemeToggle />
      </div>

      {/* Account Actions */}
      <div className="profile-actions-card">
        <Link to="/history" className="profile-history-link">View care history →</Link>
        <Button variant="secondary" onClick={handleLogout} loading={loggingOut}>
          <SignOut size={18} /> Log Out
        </Button>
      </div>

      {/* Danger Zone (T-107 / SPEC-018) */}
      <hr className="danger-zone-hr" />
      <div className="danger-zone">
        <button
          className="danger-zone-trigger"
          aria-expanded={dangerZoneOpen}
          aria-controls="danger-zone-content"
          onClick={() => setDangerZoneOpen(prev => !prev)}
        >
          <CaretRight
            size={16}
            className={`danger-zone-chevron${dangerZoneOpen ? ' danger-zone-chevron--open' : ''}`}
            aria-hidden="true"
          />
          <span className="danger-zone-label">Danger Zone</span>
        </button>

        <div
          id="danger-zone-content"
          role="region"
          aria-label="Danger Zone"
          className={`danger-zone-content${dangerZoneOpen ? ' danger-zone-content--open' : ''}`}
        >
          <div className="danger-zone-inner">
            <p className="danger-zone-body">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              ref={deleteButtonRef}
              className="danger-zone-delete-btn"
              onClick={() => setShowDeleteModal(true)}
              aria-haspopup="dialog"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
