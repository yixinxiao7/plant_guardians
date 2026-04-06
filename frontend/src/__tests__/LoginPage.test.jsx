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
});
