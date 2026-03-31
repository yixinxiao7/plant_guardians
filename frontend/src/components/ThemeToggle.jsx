import { Monitor, Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from '../hooks/useTheme.js';
import './ThemeToggle.css';

const OPTIONS = [
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle-section">
      <span className="theme-toggle-label">Appearance</span>
      <div className="theme-toggle-control" role="radiogroup" aria-label="Theme preference">
        {OPTIONS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            role="radio"
            aria-checked={theme === value}
            className={`theme-toggle-option ${theme === value ? 'theme-toggle-option--active' : ''}`}
            onClick={() => setTheme(value)}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
