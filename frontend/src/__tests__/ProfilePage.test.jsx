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
const mockDeleteAccount = vi.fn();
vi.mock('../utils/api.js', () => ({
  profile: {
    get: (...args) => mockProfileGet(...args),
  },
  auth: {
    deleteAccount: (...args) => mockDeleteAccount(...args),
  },
  clearTokens: vi.fn(),
}));

vi.mock('../utils/formatDate.js', () => ({
  formatMonthYear: () => 'January 2025',
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

  describe('Delete Account', () => {
    beforeEach(() => {
      mockProfileGet.mockResolvedValue({
        user: { full_name: 'Jane Doe', email: 'jane@example.com', created_at: '2025-01-15' },
        stats: { plant_count: 5, days_as_member: 100, total_care_actions: 42 },
      });
    });

    it('shows Delete Account button when profile is loaded', async () => {
      render(<ProfilePage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
      });
    });

    it('opens delete confirmation modal on button click', async () => {
      render(<ProfilePage />);
      await waitFor(() => screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete your account?')).toBeInTheDocument();
      expect(screen.getByText(/permanently delete your account/)).toBeInTheDocument();
    });

    it('closes modal when Cancel is clicked', async () => {
      render(<ProfilePage />);
      await waitFor(() => screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls deleteAccount API and redirects on success', async () => {
      mockDeleteAccount.mockResolvedValue(null);
      render(<ProfilePage />);
      await waitFor(() => screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByText('Delete my account'));
      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(mockAddToast).toHaveBeenCalledWith('Your account has been deleted.', 'info');
      });
    });

    it('shows error message when delete fails with server error', async () => {
      const error = new Error('Server error');
      error.status = 500;
      mockDeleteAccount.mockRejectedValue(error);
      render(<ProfilePage />);
      await waitFor(() => screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByText('Delete my account'));
      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      });
    });

    it('shows session expired message on 401 error', async () => {
      const error = new Error('Unauthorized');
      error.status = 401;
      mockDeleteAccount.mockRejectedValue(error);
      render(<ProfilePage />);
      await waitFor(() => screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
      fireEvent.click(screen.getByText('Delete my account'));
      await waitFor(() => {
        expect(screen.getByText('Session expired. Please log in again.')).toBeInTheDocument();
      });
    });
  });
});
