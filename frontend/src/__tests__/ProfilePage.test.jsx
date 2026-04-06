import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProfilePage from '../pages/ProfilePage.jsx';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  CalendarBlank: (props) => <span data-testid="icon-calendar" {...props} />,
  CheckCircle: (props) => <span data-testid="icon-check" {...props} />,
  SignOut: (props) => <span data-testid="icon-signout" {...props} />,
  WarningOctagon: (props) => <span data-testid="icon-warning" {...props} />,
  Monitor: (props) => <span data-testid="icon-monitor" {...props} />,
  Sun: (props) => <span data-testid="icon-sun" {...props} />,
  Moon: (props) => <span data-testid="icon-moon" {...props} />,
  Eye: (props) => <span data-testid="icon-eye" {...props} />,
  EyeSlash: (props) => <span data-testid="icon-eye-slash" {...props} />,
  CaretRight: (props) => <span data-testid="icon-caret-right" {...props} />,
  Warning: (props) => <span data-testid="icon-warning-triangle" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

vi.mock('../components/ThemeToggle.jsx', () => ({
  default: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

vi.mock('../hooks/useAuth.jsx', () => ({
  useAuth: () => ({
    user: { full_name: 'Jane Doe', email: 'jane@example.com' },
    logout: vi.fn(),
  }),
}));

const mockAddToast = vi.fn();
vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

const mockProfileGet = vi.fn();
const mockProfileDelete = vi.fn();
vi.mock('../utils/api.js', () => ({
  profile: {
    get: (...args) => mockProfileGet(...args),
    delete: (...args) => mockProfileDelete(...args),
  },
  clearTokens: vi.fn(),
}));

vi.mock('../utils/formatDate.js', () => ({
  formatMonthYear: () => 'January 2025',
}));

vi.mock('../hooks/useStreak.jsx', () => ({
  useStreak: () => ({
    data: null,
    loading: true,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../components/StreakTile.jsx', () => ({
  default: () => <div data-testid="streak-tile">Streak Tile</div>,
}));

vi.mock('../components/RemindersSection.jsx', () => ({
  default: () => <div data-testid="reminders-section">Reminders Section</div>,
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileGet.mockReturnValue(new Promise(() => {})); // Never resolves — loading state
  });

  it('renders without crashing', () => {
    render(<ProfilePage />);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('renders loading skeleton initially', () => {
    render(<ProfilePage />);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  describe('Danger Zone & Delete Account', () => {
    beforeEach(() => {
      mockProfileGet.mockResolvedValue({
        user: { full_name: 'Jane Doe', email: 'jane@example.com', created_at: '2025-01-15' },
        stats: { plant_count: 5, days_as_member: 100, total_care_actions: 42 },
      });
    });

    it('renders Danger Zone collapsed by default', async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      });
      const trigger = screen.getByText('Danger Zone').closest('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('expands Danger Zone on click', async () => {
      render(<ProfilePage />);
      await waitFor(() => screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Danger Zone'));
      const trigger = screen.getByText('Danger Zone').closest('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Delete my account')).toBeInTheDocument();
    });

    it('opens delete confirmation modal from Danger Zone', async () => {
      render(<ProfilePage />);
      await waitFor(() => screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Delete my account'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete your account?')).toBeInTheDocument();
    });

    it('closes modal when Cancel is clicked', async () => {
      render(<ProfilePage />);
      await waitFor(() => screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Delete my account'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls profile.delete() and redirects on success', async () => {
      mockProfileDelete.mockResolvedValue(null);
      render(<ProfilePage />);
      await waitFor(() => screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Delete my account'));

      const input = screen.getByLabelText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      // There are two "Delete my account" buttons — the confirm one in the modal
      const confirmBtns = screen.getAllByText('Delete my account');
      const confirmBtn = confirmBtns.find(el => el.closest('.dam-confirm-btn'));
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockProfileDelete).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login?deleted=true', { replace: true });
      });
    });

    it('shows inline error when deletion fails', async () => {
      mockProfileDelete.mockRejectedValue(new Error('Server error'));
      render(<ProfilePage />);
      await waitFor(() => screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Danger Zone'));
      fireEvent.click(screen.getByText('Delete my account'));

      const input = screen.getByLabelText('Type DELETE to confirm');
      fireEvent.change(input, { target: { value: 'DELETE' } });

      const confirmBtns = screen.getAllByText('Delete my account');
      const confirmBtn = confirmBtns.find(el => el.closest('.dam-confirm-btn'));
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText('Could not delete your account. Please try again.')).toBeInTheDocument();
      });
    });
  });
});
