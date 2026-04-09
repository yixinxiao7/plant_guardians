import { render, screen } from '@testing-library/react';
import InventoryPage from '../pages/InventoryPage.jsx';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  Plus: (props) => <span data-testid="icon-plus" {...props} />,
  MagnifyingGlass: (props) => <span data-testid="icon-search" {...props} />,
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PencilSimple: (props) => <span data-testid="icon-pencil" {...props} />,
  TrashSimple: (props) => <span data-testid="icon-trash" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted-plant" {...props} />,
}));

vi.mock('../hooks/useAuth.jsx', () => ({
  useAuth: () => ({
    user: { full_name: 'Test User', email: 'test@example.com' },
    consumeOAuthToast: () => null,
  }),
}));

vi.mock('../hooks/usePlants.js', () => ({
  usePlants: () => ({
    plants: [],
    loading: true,
    error: null,
    fetchPlants: vi.fn().mockResolvedValue([]),
    deletePlant: vi.fn(),
  }),
}));

vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

describe('InventoryPage', () => {
  it('renders without crashing', () => {
    render(<InventoryPage />);
    expect(screen.getByText('My Plants')).toBeInTheDocument();
  });

  it('renders loading skeleton initially', () => {
    render(<InventoryPage />);
    expect(screen.getByText('My Plants')).toBeInTheDocument();
    const grid = document.querySelector('[aria-busy="true"]');
    expect(grid).toBeInTheDocument();
  });
});
