import { render, screen } from '@testing-library/react';
import StreakTile from '../components/StreakTile.jsx';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  Fire: (props) => <span data-testid="icon-fire" {...props} />,
  TrendUp: (props) => <span data-testid="icon-trendup" {...props} />,
}));

vi.mock('../components/Button.jsx', () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

// Mock window.matchMedia for milestone animation checks
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: true, // prefers-reduced-motion: reduce — skip confetti in tests
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('StreakTile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders loading skeleton when loading=true', () => {
    render(<StreakTile data={null} loading={true} error={null} />);
    expect(screen.getByLabelText('Loading streak data')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading streak data')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders empty state for new user (streak=0, no lastActionDate)', () => {
    render(
      <StreakTile
        data={{ currentStreak: 0, longestStreak: 0, lastActionDate: null }}
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('Start your streak today!')).toBeInTheDocument();
    expect(screen.getByText(/Log your first care action/)).toBeInTheDocument();
    expect(screen.getByText('Go to your plants')).toBeInTheDocument();
  });

  it('renders broken state when streak=0 with lastActionDate', () => {
    render(
      <StreakTile
        data={{ currentStreak: 0, longestStreak: 5, lastActionDate: '2026-03-30' }}
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/Your streak ended/)).toBeInTheDocument();
    expect(screen.getByLabelText('Current care streak: 0 days')).toBeInTheDocument();
    expect(screen.getByLabelText('Longest streak: 5 days')).toBeInTheDocument();
  });

  it('renders active state with streak count and longest streak', () => {
    render(
      <StreakTile
        data={{ currentStreak: 3, longestStreak: 10, lastActionDate: '2026-04-05' }}
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('day streak')).toBeInTheDocument();
    expect(screen.getByText('personal best')).toBeInTheDocument();
    expect(screen.getByText(/Keep it up! 3 days and counting/)).toBeInTheDocument();
  });

  it('renders milestone badge at 7-day streak', () => {
    render(
      <StreakTile
        data={{ currentStreak: 7, longestStreak: 7, lastActionDate: '2026-04-05' }}
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('🎉 One week!')).toBeInTheDocument();
    expect(screen.getByLabelText('Milestone: 7 day streak')).toBeInTheDocument();
    expect(screen.getByText(/One week strong/)).toBeInTheDocument();
  });

  it('renders milestone badge at 30-day streak', () => {
    render(
      <StreakTile
        data={{ currentStreak: 30, longestStreak: 30, lastActionDate: '2026-04-05' }}
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('🌟 One month!')).toBeInTheDocument();
    expect(screen.getByText(/officially no longer a plant-killer/)).toBeInTheDocument();
  });

  it('renders milestone badge at 100-day streak', () => {
    render(
      <StreakTile
        data={{ currentStreak: 100, longestStreak: 100, lastActionDate: '2026-04-05' }}
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('🏆 100 days!')).toBeInTheDocument();
    expect(screen.getByText(/certified Plant Guardian/)).toBeInTheDocument();
  });

  it('shows "(current record!)" when current equals longest and >= 7', () => {
    render(
      <StreakTile
        data={{ currentStreak: 12, longestStreak: 12, lastActionDate: '2026-04-05' }}
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('(current record!)')).toBeInTheDocument();
  });

  it('returns null when there is an error', () => {
    const { container } = render(
      <StreakTile data={null} loading={false} error="Network error" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders motivational message with aria-live', () => {
    render(
      <StreakTile
        data={{ currentStreak: 1, longestStreak: 1, lastActionDate: '2026-04-05' }}
        loading={false}
        error={null}
      />
    );
    const message = screen.getByText(/Great start/);
    expect(message.closest('[aria-live="polite"]')).toBeInTheDocument();
  });
});
