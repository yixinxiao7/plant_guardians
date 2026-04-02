import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AnalyticsPage from '../pages/AnalyticsPage.jsx';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@phosphor-icons/react', () => ({
  CheckCircle: (props) => <span data-testid="icon-check" {...props} />,
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  Lightning: (props) => <span data-testid="icon-lightning" {...props} />,
  WarningCircle: (props) => <span data-testid="icon-warning" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted" {...props} />,
}));

const mockGetStats = vi.fn();

vi.mock('../utils/api.js', () => ({
  careStats: {
    get: (...args) => mockGetStats(...args),
  },
}));

vi.mock('../utils/formatDate.js', () => ({
  formatRelativeTime: () => '2 days ago',
  formatFullDateTime: () => 'March 29, 2026 at 10:00 AM',
}));

const sampleData = {
  total_care_actions: 42,
  by_plant: [
    { plant_id: 'p1', plant_name: 'Monstera', count: 15, last_action_at: '2026-03-29T10:00:00Z' },
    { plant_id: 'p2', plant_name: 'Spider Plant', count: 8, last_action_at: '2026-03-25T10:00:00Z' },
  ],
  by_care_type: [
    { care_type: 'watering', count: 30 },
    { care_type: 'fertilizing', count: 8 },
    { care_type: 'repotting', count: 4 },
  ],
  recent_activity: [
    { plant_name: 'Monstera', care_type: 'watering', performed_at: '2026-03-29T10:00:00Z' },
    { plant_name: 'Spider Plant', care_type: 'fertilizing', performed_at: '2026-03-28T10:00:00Z' },
  ],
};

const emptyData = {
  total_care_actions: 0,
  by_plant: [],
  by_care_type: [],
  recent_activity: [],
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton on mount', () => {
    mockGetStats.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<AnalyticsPage />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders populated state with data', async () => {
    mockGetStats.mockResolvedValue(sampleData);
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total care actions')).toBeInTheDocument();
    });

    expect(screen.getAllByText('42').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Most cared-for plant')).toBeInTheDocument();
    expect(screen.getAllByText('Monstera').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Watering').length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when total_care_actions is 0', async () => {
    mockGetStats.mockResolvedValue(emptyData);
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Your care journey starts here')).toBeInTheDocument();
    });

    expect(screen.getByText('Go to my plants')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    mockGetStats.mockRejectedValue({ message: 'Server error', status: 500 });
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Couldn't load your analytics")).toBeInTheDocument();
    });

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('retries fetch when retry button clicked', async () => {
    mockGetStats.mockRejectedValueOnce({ message: 'fail', status: 500 });
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    mockGetStats.mockResolvedValueOnce(sampleData);
    fireEvent.click(screen.getByText('Try again'));

    expect(mockGetStats).toHaveBeenCalledTimes(2);
  });

  it('renders sr-only accessible table for chart data', async () => {
    mockGetStats.mockResolvedValue(sampleData);
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total care actions')).toBeInTheDocument();
    });

    const srTable = screen.getByLabelText('Care actions by type');
    expect(srTable).toBeInTheDocument();
    expect(srTable.tagName).toBe('TABLE');
  });

  it('renders per-plant frequency table', async () => {
    mockGetStats.mockResolvedValue(sampleData);
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Care frequency by plant')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Spider Plant').length).toBeGreaterThanOrEqual(1);
  });
});
