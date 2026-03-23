import { render, screen } from '@testing-library/react';
import PlantDetailPage from '../pages/PlantDetailPage.jsx';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  PencilSimple: (props) => <span data-testid="icon-pencil" {...props} />,
  TrashSimple: (props) => <span data-testid="icon-trash" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted-plant" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/usePlants.js', () => ({
  usePlantDetail: () => ({
    plant: null,
    loading: true,
    error: null,
    notFound: false,
    fetchPlant: vi.fn().mockResolvedValue(null),
    markCareAsDone: vi.fn(),
    undoCareAction: vi.fn(),
  }),
}));

vi.mock('../hooks/useToast.js', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('../utils/api.js', () => ({
  plants: {
    delete: vi.fn(),
  },
}));

vi.mock('../utils/formatDate.js', () => ({
  formatDate: () => 'Jan 1, 2025',
  formatRelativeTime: () => '2 days ago',
  formatDueDate: () => 'Tomorrow',
}));

describe('PlantDetailPage', () => {
  it('renders without crashing', () => {
    render(<PlantDetailPage />);
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders loading skeleton initially', () => {
    render(<PlantDetailPage />);
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
