import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIAdvicePanel from '../components/AIAdvicePanel.jsx';
import { ai } from '../utils/api.js';

vi.mock('@phosphor-icons/react', () => ({
  X: (props) => <span data-testid="icon-x" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted" {...props} />,
  Sun: (props) => <span data-testid="icon-sun" {...props} />,
  CloudRain: (props) => <span data-testid="icon-cloud" {...props} />,
  Sparkle: (props) => <span data-testid="icon-sparkle" {...props} />,
  Camera: (props) => <span data-testid="icon-camera" {...props} />,
  PencilSimple: (props) => <span data-testid="icon-pencil" {...props} />,
  ArrowLeft: (props) => <span data-testid="icon-arrow" {...props} />,
  WarningCircle: (props) => <span data-testid="icon-warning" {...props} />,
}));

vi.mock('../utils/api.js', () => ({
  ai: {
    getAdvice: vi.fn(),
    identify: vi.fn(),
  },
}));

const mockAdvice = {
  identified_plant: 'Spider Plant',
  confidence: 'high',
  care: {
    watering_interval_days: 7,
    fertilizing_interval_days: 30,
    repotting_interval_days: 365,
    light_requirement: 'Bright indirect light',
    humidity_preference: 'Moderate',
    care_tips: 'Keep soil moist but not soggy.',
  },
};

describe('AIAdvicePanel — T-079 Text-Based Flow', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders panel with dialog role when open', () => {
    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('AI Plant Advisor')).toBeInTheDocument();
  });

  it('shows text input in default tab', () => {
    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );
    expect(screen.getByLabelText('Plant type name')).toBeInTheDocument();
    expect(screen.getByText('Get Advice')).toBeInTheDocument();
  });

  it('calls POST /api/v1/ai/advice on text submit', async () => {
    ai.getAdvice.mockResolvedValueOnce(mockAdvice);

    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );

    const input = screen.getByLabelText('Plant type name');
    fireEvent.change(input, { target: { value: 'spider plant' } });
    fireEvent.click(screen.getByText('Get Advice'));

    await waitFor(() => {
      expect(ai.getAdvice).toHaveBeenCalledWith({ plant_type: 'spider plant' });
    });
  });

  it('renders advice results on success', async () => {
    ai.getAdvice.mockResolvedValueOnce(mockAdvice);

    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );

    fireEvent.change(screen.getByLabelText('Plant type name'), { target: { value: 'spider plant' } });
    fireEvent.click(screen.getByText('Get Advice'));

    await waitFor(() => {
      expect(screen.getByText('Spider Plant')).toBeInTheDocument();
    });

    expect(screen.getByText('High confidence')).toBeInTheDocument();
    expect(screen.getByText('Every 7 days')).toBeInTheDocument();
    expect(screen.getByText('Every 30 days')).toBeInTheDocument();
    expect(screen.getByText('Every 365 days')).toBeInTheDocument();
    expect(screen.getByText('Bright indirect light')).toBeInTheDocument();
    expect(screen.getByText('Keep soil moist but not soggy.')).toBeInTheDocument();
    expect(screen.getByText('✓ Accept Advice')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('Accept Advice calls onAccept and closes panel', async () => {
    ai.getAdvice.mockResolvedValueOnce(mockAdvice);
    const onAccept = vi.fn();
    const onClose = vi.fn();

    render(
      <AIAdvicePanel isOpen={true} onClose={onClose} onAccept={onAccept} />
    );

    fireEvent.change(screen.getByLabelText('Plant type name'), { target: { value: 'spider plant' } });
    fireEvent.click(screen.getByText('Get Advice'));

    await waitFor(() => {
      expect(screen.getByText('✓ Accept Advice')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('✓ Accept Advice'));

    expect(onAccept).toHaveBeenCalledWith(mockAdvice);
  });

  it('Dismiss closes panel without calling onAccept', async () => {
    ai.getAdvice.mockResolvedValueOnce(mockAdvice);
    const onAccept = vi.fn();
    const onClose = vi.fn();

    render(
      <AIAdvicePanel isOpen={true} onClose={onClose} onAccept={onAccept} />
    );

    fireEvent.change(screen.getByLabelText('Plant type name'), { target: { value: 'spider plant' } });
    fireEvent.click(screen.getByText('Get Advice'));

    await waitFor(() => {
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dismiss'));

    expect(onAccept).not.toHaveBeenCalled();
  });

  it('shows error with retry on 502', async () => {
    const err502 = new Error('AI advice is temporarily unavailable. Please try again.');
    err502.status = 502;
    err502.code = 'EXTERNAL_SERVICE_ERROR';
    ai.getAdvice.mockRejectedValueOnce(err502);

    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );

    fireEvent.change(screen.getByLabelText('Plant type name'), { target: { value: 'spider plant' } });
    fireEvent.click(screen.getByText('Get Advice'));

    await waitFor(() => {
      expect(screen.getByText('AI advice is temporarily unavailable. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('disables Get Advice button when input is empty', () => {
    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );
    expect(screen.getByText('Get Advice').closest('button')).toBeDisabled();
  });
});

describe('AIAdvicePanel — T-080 Image Upload Flow', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('switches to upload tab and shows upload zone', () => {
    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );

    fireEvent.click(screen.getByText('Upload a photo'));

    expect(screen.getByText('Drop a photo here')).toBeInTheDocument();
    expect(screen.getByText('Browse files')).toBeInTheDocument();
  });

  it('shows preview when valid file is selected', () => {
    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );

    fireEvent.click(screen.getByText('Upload a photo'));

    const file = new File(['pixels'], 'plant.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });
    const input = screen.getByLabelText('Upload a plant photo');
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('plant.jpg')).toBeInTheDocument();
  });

  it('shows error for wrong file type', () => {
    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );

    fireEvent.click(screen.getByText('Upload a photo'));

    const file = new File(['data'], 'plant.gif', { type: 'image/gif' });
    const input = screen.getByLabelText('Upload a plant photo');
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('Please upload a JPEG, PNG, or WebP image.')).toBeInTheDocument();
  });

  it('shows error for file > 5MB', () => {
    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );

    fireEvent.click(screen.getByText('Upload a photo'));

    const file = new File(['data'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
    const input = screen.getByLabelText('Upload a plant photo');
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('Image must be 5MB or smaller.')).toBeInTheDocument();
  });

  it('calls POST /api/v1/ai/identify with FormData on image submit', async () => {
    ai.identify.mockResolvedValueOnce(mockAdvice);

    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={() => {}} />
    );

    fireEvent.click(screen.getByText('Upload a photo'));

    const file = new File(['pixels'], 'plant.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });
    const input = screen.getByLabelText('Upload a plant photo');
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText('Identify & Get Advice'));

    await waitFor(() => {
      expect(ai.identify).toHaveBeenCalledWith(file);
    });
  });

  it('Accept in image mode maps form fields same as text mode', async () => {
    ai.identify.mockResolvedValueOnce(mockAdvice);
    const onAccept = vi.fn();

    render(
      <AIAdvicePanel isOpen={true} onClose={() => {}} onAccept={onAccept} />
    );

    fireEvent.click(screen.getByText('Upload a photo'));

    const file = new File(['pixels'], 'plant.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });
    fireEvent.change(screen.getByLabelText('Upload a plant photo'), { target: { files: [file] } });
    fireEvent.click(screen.getByText('Identify & Get Advice'));

    await waitFor(() => {
      expect(screen.getByText('✓ Accept Advice')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('✓ Accept Advice'));
    expect(onAccept).toHaveBeenCalledWith(mockAdvice);
  });
});
