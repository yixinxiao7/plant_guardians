import { render, screen } from '@testing-library/react';
import AIAdviceModal from '../components/AIAdviceModal.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Sparkle: (props) => <span data-testid="icon-sparkle" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted-plant" {...props} />,
  Sun: (props) => <span data-testid="icon-sun" {...props} />,
  CloudRain: (props) => <span data-testid="icon-cloud-rain" {...props} />,
  Lightbulb: (props) => <span data-testid="icon-lightbulb" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  Image: (props) => <span data-testid="icon-image" {...props} />,
  Camera: (props) => <span data-testid="icon-camera" {...props} />,
}));

vi.mock('../utils/api.js', () => ({
  ai: { getAdvice: vi.fn() },
}));

vi.mock('../utils/validation.js', () => ({
  validatePhotoFile: () => null,
}));

describe('AIAdviceModal', () => {
  it('renders without crashing when open', () => {
    render(
      <AIAdviceModal
        isOpen={true}
        onClose={() => {}}
        onAccept={() => {}}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders input state when open', () => {
    render(
      <AIAdviceModal
        isOpen={true}
        onClose={() => {}}
        onAccept={() => {}}
      />
    );
    expect(screen.getByText(/Tell us about your plant/)).toBeInTheDocument();
    expect(screen.getByLabelText('Enter Plant Type')).toBeInTheDocument();
    expect(screen.getByText('Get AI Advice')).toBeInTheDocument();
  });
});
