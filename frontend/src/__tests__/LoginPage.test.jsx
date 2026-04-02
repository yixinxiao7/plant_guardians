import { render, screen } from '@testing-library/react';
import LoginPage from '../pages/LoginPage.jsx';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  Eye: (props) => <span data-testid="icon-eye" {...props} />,
  EyeSlash: (props) => <span data-testid="icon-eye-slash" {...props} />,
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
});
