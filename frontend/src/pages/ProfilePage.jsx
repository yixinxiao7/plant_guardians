import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plant, CalendarBlank, CheckCircle, SignOut } from '@phosphor-icons/react';
import { profile as profileApi, auth as authApi, clearTokens } from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { formatMonthYear } from '../utils/formatDate.js';
import Button from '../components/Button.jsx';
import DeleteAccountModal from '../components/DeleteAccountModal.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleDeleteAccount = async (password) => {
    // This is called from the modal's onConfirm with the entered password
    // If it throws, the modal catches it and shows inline error
    const err = await authApi.deleteAccount(password).then(() => null, (e) => e);

    if (err) {
      if (err.status === 401) {
        // Session expired — redirect after 2s
        setTimeout(() => {
          clearTokens();
          sessionStorage.removeItem('pg_user');
          navigate('/login');
        }, 2000);
      }
      throw err;
    }

    // Success: clear everything and redirect
    clearTokens();
    sessionStorage.removeItem('pg_user');
    addToast('Your account has been deleted.', 'danger');
    navigate('/login');
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
          <Plant size={32} color="var(--color-accent-primary)" />
          <span className="stat-number">{stats.plant_count ?? 0}</span>
          <span className="stat-label">Plants in care</span>
        </div>
        <div className="stat-tile" role="figure" aria-label={`${stats.days_as_member || 0} Days as a Guardian`}>
          <CalendarBlank size={32} color="var(--color-accent-primary)" />
          <span className="stat-number">{stats.days_as_member ?? 0}</span>
          <span className="stat-label">Days as a Guardian</span>
        </div>
        <div className="stat-tile" role="figure" aria-label={`${stats.total_care_actions || 0} Care actions completed`}>
          <CheckCircle size={32} color="var(--color-accent-primary)" />
          <span className="stat-number">{stats.total_care_actions ?? 0}</span>
          <span className="stat-label">Care actions completed</span>
        </div>
      </div>

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
        <button
          className="profile-delete-btn"
          onClick={() => setShowDeleteModal(true)}
          aria-label="Delete account"
          aria-haspopup="dialog"
        >
          Delete Account
        </button>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteSuccess={handleDeleteAccount}
      />
    </div>
  );
}
