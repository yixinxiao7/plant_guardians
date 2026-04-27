import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../pages/LoginPage.jsx';

const mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [mockSearchParams],
}));

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  Eye: (props) => <span data-testid="icon-eye" {...props} />,
  EyeSlash: (props) => <span data-testid="icon-eye-slash" {...props} />,
  Info: (props) => <span data-testid="icon-info" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  Warning: (props) => <span data-testid="icon-warning" {...props} />,
}));

vi.mock('../hooks/useAuth.jsx', () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
  }),
}));

vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('../utils/validation.js', () => ({
  validateEmail: () => null,
  validatePassword: () => null,
  validateFullName: () => null,
  validateConfirmPassword: () => null,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    for (const key of [...mockSearchParams.keys()]) {
      mockSearchParams.delete(key);
    }
  });

  it('renders without crashing', () => {
    render(<LoginPage />);
    expect(screen.getAllByText('Plant Guardians').length).toBeGreaterThan(0);
  });

  it('renders login form with tabs', () => {
    render(<LoginPage />);
    expect(screen.getByRole('tab', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sign Up' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
  });

  it('shows deletion banner when ?deleted=true is present', () => {
    mockSearchParams.set('deleted', 'true');
    render(<LoginPage />);
    expect(screen.getByText('Your account has been permanently deleted.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not show deletion banner when ?deleted is absent', () => {
    render(<LoginPage />);
    expect(screen.queryByText('Your account has been permanently deleted.')).not.toBeInTheDocument();
  });

  it('dismisses deletion banner on × click', () => {
    mockSearchParams.set('deleted', 'true');
    render(<LoginPage />);
    expect(screen.getByText('Your account has been permanently deleted.')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Your account has been permanently deleted.')).not.toBeInTheDocument();
  });

  // --- T-121 Required Tests ---

  it('renders Google button on Log In tab with "or" divider', () => {
    render(<LoginPage />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('renders Google button on Sign Up tab', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Sign Up' }));
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('navigates to /api/v1/auth/google on Google button click', () => {
    // Spy on window.location.href setter
    const hrefSetter = vi.fn();
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: '', set href(val) { hrefSetter(val); } };

    render(<LoginPage />);
    fireEvent.click(screen.getByText('Sign in with Google'));
    expect(hrefSetter).toHaveBeenCalledWith('/api/v1/auth/google');

    window.location = originalLocation;
  });

  // --- T-121 Recommended Tests ---

  it('shows error banner when ?error=oauth_failed is present', () => {
    mockSearchParams.set('error', 'oauth_failed');
    render(<LoginPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('shows error banner when ?error=access_denied is present', () => {
    mockSearchParams.set('error', 'access_denied');
    render(<LoginPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/You cancelled/)).toBeInTheDocument();
  });
});
