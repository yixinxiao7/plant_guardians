import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  User: (props) => <span data-testid="icon-user" {...props} />,
  SignOut: (props) => <span data-testid="icon-signout" {...props} />,
  List: (props) => <span data-testid="icon-list" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  ClockCounterClockwise: (props) => <span data-testid="icon-clock" {...props} />,
  BellSimple: (props) => <span data-testid="icon-bell" {...props} />,
}));

vi.mock('../hooks/useAuth.jsx', () => ({
  useAuth: () => ({
    user: { full_name: 'Jane Doe', email: 'jane@example.com' },
    logout: vi.fn(),
  }),
}));

describe('Sidebar', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText('Plant Guardians')).toBeInTheDocument();
  });

  it('renders nav links', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText('My Plants')).toBeInTheDocument();
    expect(screen.getByText('Care Due')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders badge when careDueBadge > 0', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} careDueBadge={5} />
      </MemoryRouter>
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('5 plants overdue or due today')).toBeInTheDocument();
  });

  it('hides badge when careDueBadge is 0', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} careDueBadge={0} />
      </MemoryRouter>
    );
    expect(screen.queryByLabelText(/plants overdue/)).not.toBeInTheDocument();
  });

  it('shows 99+ for badge count >= 100', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={() => {}} careDueBadge={150} />
      </MemoryRouter>
    );
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});
