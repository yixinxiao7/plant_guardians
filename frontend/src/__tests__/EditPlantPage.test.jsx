import { render, screen } from '@testing-library/react';
import EditPlantPage from '../pages/EditPlantPage.jsx';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  Sparkle: (props) => <span data-testid="icon-sparkle" {...props} />,
  Plus: (props) => <span data-testid="icon-plus" {...props} />,
  CaretDown: (props) => <span data-testid="icon-caret-down" {...props} />,
  CaretUp: (props) => <span data-testid="icon-caret-up" {...props} />,
  Image: (props) => <span data-testid="icon-image" {...props} />,
  Camera: (props) => <span data-testid="icon-camera" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  Eye: (props) => <span data-testid="icon-eye" {...props} />,
  EyeSlash: (props) => <span data-testid="icon-eye-slash" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted-plant" {...props} />,
  Sun: (props) => <span data-testid="icon-sun" {...props} />,
  CloudRain: (props) => <span data-testid="icon-cloud-rain" {...props} />,
  Lightbulb: (props) => <span data-testid="icon-lightbulb" {...props} />,
}));

vi.mock('../hooks/usePlants.js', () => ({
  usePlantDetail: () => ({
    plant: null,
    loading: true,
    error: null,
    notFound: false,
    fetchPlant: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock('../hooks/useToast.js', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('../utils/api.js', () => ({
  plants: {
    update: vi.fn(),
    uploadPhoto: vi.fn(),
  },
  ai: {
    getAdvice: vi.fn(),
  },
}));

vi.mock('../utils/validation.js', () => ({
  validatePlantName: () => null,
  validateFrequencyValue: () => null,
  validatePhotoFile: () => null,
}));

describe('EditPlantPage', () => {
  it('renders without crashing', () => {
    render(<EditPlantPage />);
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders loading skeleton initially', () => {
    render(<EditPlantPage />);
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
