import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'plant-guardians-theme';

function getStoredPreference() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'system';
}

function applyTheme(preference) {
  const root = document.documentElement;
  if (preference === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (preference === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    // System: let the CSS media query handle it, but also set attribute for JS consumers
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredPreference);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    if (newTheme === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, newTheme);
    }
    applyTheme(newTheme);
  }, []);

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || stored === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply theme on mount (in case React hydrates after the inline script)
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return { theme, setTheme };
}
