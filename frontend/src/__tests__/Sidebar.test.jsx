import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  User: (props) => <span data-testid="icon-user" {...props} />,
  SignOut: (props) => <span data-testid="icon-signout" {...props} />,
  List: (props) => <span data-testid="icon-list" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

vi.mock('../hooks/useAuth.js', () => ({
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
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
});
