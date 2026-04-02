import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CareHistoryPage from '../pages/CareHistoryPage.jsx';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@phosphor-icons/react', () => ({
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted" {...props} />,
  WarningCircle: (props) => <span data-testid="icon-warning" {...props} />,
}));

const mockCareActionsList = vi.fn();
const mockPlantsList = vi.fn();

vi.mock('../utils/api.js', () => ({
  careActions: {
    list: (...args) => mockCareActionsList(...args),
  },
  plants: {
    list: (...args) => mockPlantsList(...args),
  },
}));

vi.mock('../utils/formatDate.js', () => ({
  formatRelativeTime: (iso) => '3 hours ago',
  formatFullDateTime: (iso) => 'March 20, 2026 at 2:14 PM',
}));

const sampleActions = [
  {
    id: 'act-1',
    plant_id: 'plant-1',
    plant_name: 'Monstera',
    care_type: 'watering',
    performed_at: '2026-03-24T14:32:00.000Z',
  },
  {
    id: 'act-2',
    plant_id: 'plant-2',
    plant_name: 'Fiddle Leaf Fig',
    care_type: 'fertilizing',
    performed_at: '2026-03-23T09:00:00.000Z',
  },
];

const samplePlants = [
  { id: 'plant-1', name: 'Monstera' },
  { id: 'plant-2', name: 'Fiddle Leaf Fig' },
];

describe('CareHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlantsList.mockResolvedValue(samplePlants);
  });

  it('renders loading skeleton initially', () => {
    mockCareActionsList.mockReturnValue(new Promise(() => {})); // never resolves
    render(<CareHistoryPage />);
    expect(screen.getByText('Care History')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading care history')).toBeInTheDocument();
  });

  it('renders populated list when data loads', async () => {
    mockCareActionsList.mockResolvedValue({
      data: sampleActions,
      pagination: { page: 1, limit: 20, total: 2 },
    });
    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Watered')).toBeInTheDocument();
    });
    expect(screen.getByText('Fertilized')).toBeInTheDocument();
    // Plant names appear in both the list and the filter dropdown
    const monsteraEls = screen.getAllByText('Monstera');
    expect(monsteraEls.length).toBe(2); // option + list item
    expect(screen.getByText('2 actions')).toBeInTheDocument();
  });

  it('renders empty state when no actions exist', async () => {
    mockCareActionsList.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('No care actions yet.')).toBeInTheDocument();
    });
    expect(screen.getByText('Start by marking a plant as watered!')).toBeInTheDocument();
    expect(screen.getByText('Go to my plants')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    mockCareActionsList.mockRejectedValue(new Error('Network error'));
    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Couldn't load your care history.")).toBeInTheDocument();
    });
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.getByLabelText('Retry loading care history')).toBeInTheDocument();
  });

  it('shows "Load more" button when more pages exist', async () => {
    mockCareActionsList.mockResolvedValue({
      data: sampleActions,
      pagination: { page: 1, limit: 2, total: 5 },
    });
    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText(/Load more/)).toBeInTheDocument();
    });
    expect(screen.getByText(/3 remaining/)).toBeInTheDocument();
  });

  it('does not show "Load more" when all items are loaded', async () => {
    mockCareActionsList.mockResolvedValue({
      data: sampleActions,
      pagination: { page: 1, limit: 20, total: 2 },
    });
    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Watered')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Load more/)).not.toBeInTheDocument();
  });

  it('renders filter dropdown with plant options', async () => {
    mockCareActionsList.mockResolvedValue({
      data: sampleActions,
      pagination: { page: 1, limit: 20, total: 2 },
    });
    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Watered')).toBeInTheDocument();
    });
    const select = screen.getByLabelText('Filter by plant:');
    expect(select).toBeInTheDocument();
    // Options: All plants + 2 plants
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(3);
  });

  it('shows filtered empty state when filter returns no results', async () => {
    mockCareActionsList
      .mockResolvedValueOnce({
        data: sampleActions,
        pagination: { page: 1, limit: 20, total: 2 },
      })
      .mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 20, total: 0 },
      });

    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Watered')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Filter by plant:');
    fireEvent.change(select, { target: { value: 'plant-1' } });

    await waitFor(() => {
      expect(screen.getByText('No actions for this plant yet.')).toBeInTheDocument();
    });
    expect(screen.getByText('Clear filter')).toBeInTheDocument();
  });

  it('retries fetch on error state "Try again" button', async () => {
    mockCareActionsList
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({
        data: sampleActions,
        pagination: { page: 1, limit: 20, total: 2 },
      });

    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Couldn't load your care history.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Retry loading care history'));

    await waitFor(() => {
      expect(mockCareActionsList).toHaveBeenCalledTimes(2);
    });
  });

  it('renders relative timestamps and full date in title attribute', async () => {
    mockCareActionsList.mockResolvedValue({
      data: sampleActions,
      pagination: { page: 1, limit: 20, total: 2 },
    });
    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Watered')).toBeInTheDocument();
    });
    const timestamps = screen.getAllByText('3 hours ago');
    expect(timestamps.length).toBeGreaterThan(0);
    expect(timestamps[0]).toHaveAttribute('title', 'March 20, 2026 at 2:14 PM');
  });

  it('navigates to inventory on empty state CTA click', async () => {
    mockCareActionsList.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0 },
    });
    render(<CareHistoryPage />);
    await waitFor(() => {
      expect(screen.getByText('Go to my plants')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Go to my plants'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
