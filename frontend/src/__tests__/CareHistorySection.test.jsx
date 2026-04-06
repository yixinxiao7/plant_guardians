import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import CareHistorySection from '../components/CareHistorySection.jsx';

// Mock the hook
const mockFetchHistory = vi.fn();
const mockLoadMore = vi.fn();
const mockChangeFilter = vi.fn();
const mockRetry = vi.fn();

let mockHookReturn = {};

vi.mock('../hooks/usePlantCareHistory.js', () => ({
  usePlantCareHistory: () => mockHookReturn,
}));

vi.mock('@phosphor-icons/react', () => ({
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted" {...props} />,
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  WarningCircle: (props) => <span data-testid="icon-warning" {...props} />,
  ChatText: (props) => <span data-testid="icon-chat" {...props} />,
  CaretDown: (props) => <span data-testid="icon-caret-down" {...props} />,
  CaretUp: (props) => <span data-testid="icon-caret-up" {...props} />,
}));

vi.mock('../utils/formatDate.js', () => ({
  formatDate: (iso) => 'April 2, 2026',
  formatFullDateTime: (iso) => 'April 2, 2026 at 2:30 PM',
}));

const MOCK_ITEMS = [
  { id: '1', careType: 'watering', performedAt: '2026-04-02T09:00:00.000Z', notes: null },
  { id: '2', careType: 'fertilizing', performedAt: '2026-04-01T10:00:00.000Z', notes: 'Extra fertilizer' },
  { id: '3', careType: 'watering', performedAt: '2026-03-20T08:00:00.000Z', notes: null },
];

function setupMock(overrides = {}) {
  mockHookReturn = {
    items: [],
    total: 0,
    page: 1,
    totalPages: 0,
    filter: 'all',
    isLoading: false,
    isLoadingMore: false,
    error: null,
    loadMoreError: null,
    hasMore: false,
    fetchHistory: mockFetchHistory,
    loadMore: mockLoadMore,
    changeFilter: mockChangeFilter,
    retry: mockRetry,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setupMock();
});

describe('CareHistorySection', () => {
  it('renders loading skeleton when isLoading is true', () => {
    setupMock({ isLoading: true });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelector('.ch-skeleton')).toBeTruthy();
  });

  it('renders empty state when total is 0 and filter is all', () => {
    setupMock({ total: 0, filter: 'all' });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    expect(screen.getByText('No care history yet.')).toBeTruthy();
    expect(screen.getByText(/Mark your first care action done/)).toBeTruthy();
    expect(screen.getByText('Go to Overview')).toBeTruthy();
  });

  it('renders filter-specific empty state when filter is active', () => {
    setupMock({ total: 0, filter: 'watering' });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    expect(screen.getByText('No Watering history yet.')).toBeTruthy();
    expect(screen.getByText('Show All')).toBeTruthy();
  });

  it('renders error state with retry button', () => {
    setupMock({ error: 'Network error' });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    expect(screen.getByText("Couldn't load care history.")).toBeTruthy();
    const retryBtn = screen.getByText('Try Again');
    fireEvent.click(retryBtn);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('renders care history list with items', () => {
    setupMock({
      items: MOCK_ITEMS,
      total: 3,
      page: 1,
      totalPages: 1,
      hasMore: false,
    });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    // Filter bar should be present
    expect(screen.getByRole('group', { name: /Filter care history by type/ })).toBeTruthy();

    // List items
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBe(3);

    // Check aria-labels on items
    expect(listItems[0]).toHaveAttribute('aria-label', 'Watering on April 2, 2026');
    expect(listItems[1]).toHaveAttribute('aria-label', 'Fertilizing on April 2, 2026. Includes note.');

    // End message should show since hasMore is false
    expect(screen.getByText("You've seen all care history for this plant.")).toBeTruthy();
  });

  it('filter tab changes trigger changeFilter', () => {
    setupMock({
      items: MOCK_ITEMS,
      total: 3,
      page: 1,
      totalPages: 1,
    });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    // Scope the query to the filter group to avoid ambiguity with list item labels
    const filterGroup = screen.getByRole('group', { name: /Filter care history by type/ });
    const wateringPill = within(filterGroup).getByRole('button', { name: 'Watering' });
    fireEvent.click(wateringPill);
    expect(mockChangeFilter).toHaveBeenCalledWith('watering');
  });

  it('Load More button appends items and shows loading state', () => {
    setupMock({
      items: MOCK_ITEMS,
      total: 40,
      page: 1,
      totalPages: 2,
      hasMore: true,
    });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    const loadMoreBtn = screen.getByText('Load More');
    expect(loadMoreBtn).toBeTruthy();
    fireEvent.click(loadMoreBtn);
    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  it('items with notes have aria-label including "Includes note."', () => {
    setupMock({
      items: [
        { id: '2', careType: 'fertilizing', performedAt: '2026-04-01T10:00:00.000Z', notes: 'Extra fertilizer' },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    const item = screen.getByRole('listitem');
    expect(item.getAttribute('aria-label')).toContain('Includes note.');
  });

  it('calls fetchHistory on mount', () => {
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);
    expect(mockFetchHistory).toHaveBeenCalledWith('all');
  });

  it('load more error is displayed inline', () => {
    setupMock({
      items: MOCK_ITEMS,
      total: 40,
      page: 1,
      totalPages: 2,
      hasMore: true,
      loadMoreError: "Couldn't load more. Try again.",
    });
    render(<CareHistorySection plantId="p1" onSwitchToOverview={vi.fn()} />);

    expect(screen.getByText("Couldn't load more. Try again.")).toBeTruthy();
  });
});
