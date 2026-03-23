import { render, screen } from '@testing-library/react';
import ProfilePage from '../pages/ProfilePage.jsx';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  CalendarBlank: (props) => <span data-testid="icon-calendar" {...props} />,
  CheckCircle: (props) => <span data-testid="icon-check" {...props} />,
  SignOut: (props) => <span data-testid="icon-signout" {...props} />,
}));

vi.mock('../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { full_name: 'Jane Doe', email: 'jane@example.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('../hooks/useToast.js', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('../utils/api.js', () => ({
  profile: {
    get: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}));

vi.mock('../utils/formatDate.js', () => ({
  formatMonthYear: () => 'January 2025',
}));

describe('ProfilePage', () => {
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
});
