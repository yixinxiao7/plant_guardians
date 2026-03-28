import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditPlantPage from '../pages/EditPlantPage.jsx';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => mockNavigate,
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

const mockPlant = {
  id: '1',
  name: 'Test Plant',
  type: 'Pothos',
  notes: 'Some notes',
  photo_url: '',
  care_schedules: [
    { care_type: 'watering', frequency_value: 7, frequency_unit: 'days', last_done_at: '2026-03-20T00:00:00.000Z' },
    { care_type: 'fertilizing', frequency_value: 1, frequency_unit: 'months', last_done_at: '2026-03-15T00:00:00.000Z' },
  ],
};

let mockUsePlantDetail;

vi.mock('../hooks/usePlants.js', () => ({
  usePlantDetail: () => mockUsePlantDetail,
}));

vi.mock('../hooks/useToast.jsx', () => ({
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
  beforeEach(() => {
    mockUsePlantDetail = {
      plant: null,
      loading: true,
      error: null,
      notFound: false,
      fetchPlant: vi.fn().mockResolvedValue(null),
    };
  });

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

  // T-047: isDirty detects last_done_at changes
  it('enables Save button when watering last_done_at is changed', async () => {
    mockUsePlantDetail = {
      plant: mockPlant,
      loading: false,
      error: null,
      notFound: false,
      fetchPlant: vi.fn().mockResolvedValue(mockPlant),
    };

    render(<EditPlantPage />);

    // Wait for form to populate
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Plant')).toBeInTheDocument();
    });

    // Save button should be disabled (no changes)
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeDisabled();

    // Change watering last done date
    const wateringDateInput = document.getElementById('watering-last-done');
    fireEvent.change(wateringDateInput, { target: { value: '2026-03-25' } });

    // Save button should now be enabled
    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });
  });

  it('enables Save button when fertilizing last_done_at is changed', async () => {
    mockUsePlantDetail = {
      plant: mockPlant,
      loading: false,
      error: null,
      notFound: false,
      fetchPlant: vi.fn().mockResolvedValue(mockPlant),
    };

    render(<EditPlantPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Plant')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeDisabled();

    // Change fertilizing last done date
    const fertDateInput = document.getElementById('fertilizing-last-done');
    fireEvent.change(fertDateInput, { target: { value: '2026-03-22' } });

    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });
  });

  it('keeps Save button disabled when last_done_at matches original', async () => {
    mockUsePlantDetail = {
      plant: mockPlant,
      loading: false,
      error: null,
      notFound: false,
      fetchPlant: vi.fn().mockResolvedValue(mockPlant),
    };

    render(<EditPlantPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Plant')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    expect(saveBtn).toBeDisabled();
  });
});
