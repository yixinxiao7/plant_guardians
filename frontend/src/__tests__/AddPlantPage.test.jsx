import { render, screen } from '@testing-library/react';
import AddPlantPage from '../pages/AddPlantPage.jsx';

vi.mock('react-router-dom', () => ({
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

vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('../utils/api.js', () => ({
  plants: {
    create: vi.fn(),
    uploadPhoto: vi.fn(),
    update: vi.fn(),
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

describe('AddPlantPage', () => {
  it('renders without crashing', () => {
    render(<AddPlantPage />);
    expect(screen.getByText('Add a New Plant')).toBeInTheDocument();
  });

  it('renders form title', () => {
    render(<AddPlantPage />);
    expect(screen.getByText('Add a New Plant')).toBeInTheDocument();
    expect(screen.getByText(/Tell us about your plant/)).toBeInTheDocument();
  });
});
