import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIAdviceModal from '../components/AIAdviceModal.jsx';
import { ai } from '../utils/api.js';

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

  it('hides Try Again button and shows correct message for AI_SERVICE_UNAVAILABLE (502) error', async () => {
    ai.getAdvice.mockRejectedValueOnce({ code: 'AI_SERVICE_UNAVAILABLE' });

    render(
      <AIAdviceModal
        isOpen={true}
        onClose={() => {}}
        onAccept={() => {}}
        plantType="Monstera"
      />
    );

    // Submit the form to trigger the error
    fireEvent.click(screen.getByText('Get AI Advice'));

    await waitFor(() => {
      expect(screen.getByText('Couldn\'t get advice right now')).toBeInTheDocument();
    });

    // Should show the correct service unavailable message
    expect(screen.getByText('Our AI service is temporarily offline. You can still add your plant manually.')).toBeInTheDocument();

    // Should NOT show "Try Again" button
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();

    // Should show "Close" button
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('shows Try Again button for non-502 errors', async () => {
    ai.getAdvice.mockRejectedValueOnce({ code: 'NETWORK_ERROR' });

    render(
      <AIAdviceModal
        isOpen={true}
        onClose={() => {}}
        onAccept={() => {}}
        plantType="Monstera"
      />
    );

    fireEvent.click(screen.getByText('Get AI Advice'));

    await waitFor(() => {
      expect(screen.getByText('Couldn\'t get advice right now')).toBeInTheDocument();
    });

    // Should show "Try Again" button for non-service-unavailable errors
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});
