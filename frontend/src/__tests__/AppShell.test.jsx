import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';

vi.mock('@phosphor-icons/react', () => ({
  List: (props) => <span data-testid="icon-list" {...props} />,
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  User: (props) => <span data-testid="icon-user" {...props} />,
  SignOut: (props) => <span data-testid="icon-signout" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  ClockCounterClockwise: (props) => <span data-testid="icon-clock" {...props} />,
  BellSimple: (props) => <span data-testid="icon-bell" {...props} />,
  ChartBar: (props) => <span data-testid="icon-chartbar" {...props} />,
}));

vi.mock('../utils/api.js', () => ({
  careDue: {
    get: vi.fn().mockResolvedValue({ overdue: [], due_today: [], upcoming: [] }),
  },
  careStreak: {
    get: vi.fn().mockResolvedValue({ currentStreak: 0, longestStreak: 0, lastActionDate: null }),
  },
}));

vi.mock('../hooks/useAuth.jsx', () => ({
  useAuth: () => ({
    user: { full_name: 'Jane Doe', email: 'jane@example.com' },
    logout: vi.fn(),
  }),
}));

describe('AppShell', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('renders sidebar and outlet area', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByText('Plant Guardians')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
