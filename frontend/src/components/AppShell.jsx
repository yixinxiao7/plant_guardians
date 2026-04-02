import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { List } from '@phosphor-icons/react';
import Sidebar from './Sidebar.jsx';
import { careDue } from '../utils/api.js';
import './AppShell.css';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [careDueBadge, setCareDueBadge] = useState(0);

  // Fetch badge count on mount
  useEffect(() => {
    const fetchBadge = async () => {
      try {
        const data = await careDue.get();
        setCareDueBadge((data.overdue?.length || 0) + (data.due_today?.length || 0));
      } catch {
        // Non-critical — badge just won't show
      }
    };
    fetchBadge();
  }, []);

  const handleBadgeUpdate = useCallback((count) => {
    setCareDueBadge(count);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} careDueBadge={careDueBadge} />
      <div className="app-main">
        <header className="app-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <List size={24} />
          </button>
        </header>
        <main className="app-content">
          <Outlet context={{ onBadgeUpdate: handleBadgeUpdate }} />
        </main>
      </div>
    </div>
  );
}
