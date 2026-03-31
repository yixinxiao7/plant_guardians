import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../components/ThemeToggle.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Monitor: (props) => <span data-testid="icon-monitor" {...props} />,
  Sun: (props) => <span data-testid="icon-sun" {...props} />,
  Moon: (props) => <span data-testid="icon-moon" {...props} />,
}));

// Mock useTheme to avoid localStorage issues in jsdom test environment
const mockSetTheme = vi.fn();
let currentTheme = 'system';

vi.mock('../hooks/useTheme.js', () => ({
  useTheme: () => ({
    theme: currentTheme,
    setTheme: (val) => {
      currentTheme = val;
      mockSetTheme(val);
      // Simulate side effects
      if (val === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        try { localStorage.setItem('plant-guardians-theme', 'dark'); } catch {}
      } else if (val === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        try { localStorage.setItem('plant-guardians-theme', 'light'); } catch {}
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        try { localStorage.removeItem('plant-guardians-theme'); } catch {}
      }
    },
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    currentTheme = 'system';
    mockSetTheme.mockClear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders without crashing with three options', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme preference')).toBeInTheDocument();
  });

  it('clicking "Dark" calls setTheme with dark and applies data-theme="dark"', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByText('Dark'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('clicking "Light" after dark calls setTheme with light and applies data-theme="light"', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByText('Dark'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    fireEvent.click(screen.getByText('Light'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('clicking "System" calls setTheme with system', () => {
    currentTheme = 'dark';
    render(<ThemeToggle />);
    fireEvent.click(screen.getByText('System'));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('displays the correct active state for the selected option', () => {
    render(<ThemeToggle />);

    // Default is system
    const systemBtn = screen.getByText('System').closest('button');
    expect(systemBtn.getAttribute('aria-checked')).toBe('true');

    // Dark should not be active
    const darkBtn = screen.getByText('Dark').closest('button');
    expect(darkBtn.getAttribute('aria-checked')).toBe('false');
  });
});
