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

vi.mock('../hooks/useToast.js', () => ({
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
