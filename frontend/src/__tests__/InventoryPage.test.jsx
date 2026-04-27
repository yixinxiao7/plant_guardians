import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import InventoryPage from '../pages/InventoryPage.jsx';

// ---- Mocks ----

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  Plus: (props) => <span data-testid="icon-plus" {...props} />,
  MagnifyingGlass: (props) => <span data-testid="icon-search" {...props} />,
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PencilSimple: (props) => <span data-testid="icon-pencil" {...props} />,
  TrashSimple: (props) => <span data-testid="icon-trash" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted-plant" {...props} />,
  Funnel: (props) => <span data-testid="icon-funnel" {...props} />,
  WarningCircle: (props) => <span data-testid="icon-warning" {...props} />,
  CheckCircle: (props) => <span data-testid="icon-check-circle" {...props} />,
  CaretDown: (props) => <span data-testid="icon-caret" {...props} />,
  Check: (props) => <span data-testid="icon-check" {...props} />,
}));

vi.mock('../hooks/useAuth.jsx', () => ({
  useAuth: () => ({
    user: { full_name: 'Test User', email: 'test@example.com' },
    consumeOAuthToast: () => null,
  }),
}));

vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

// usePlants mock — make it controllable per test via a module-level state.
let __usePlantsState;
function defaultUsePlantsState() {
  return {
    plants: [],
    pagination: null,
    statusCounts: null,
    loading: true,
    error: null,
    fetchPlants: vi.fn().mockResolvedValue([]),
    deletePlant: vi.fn(),
  };
}
vi.mock('../hooks/usePlants.js', () => ({
  usePlants: () => __usePlantsState,
}));

beforeEach(() => {
  __usePlantsState = defaultUsePlantsState();
});

describe('InventoryPage — base rendering', () => {
  it('renders without crashing', () => {
    render(<InventoryPage />);
    expect(screen.getByText('My Plants')).toBeInTheDocument();
  });

  it('renders the search bar, filter group, and sort dropdown', () => {
    render(<InventoryPage />);
    expect(screen.getByLabelText('Search plants')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Filter by status' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort plants' })).toBeInTheDocument();
  });

  it('renders the loading skeleton during initial load', () => {
    render(<InventoryPage />);
    const grid = document.querySelector('[aria-busy="true"]');
    expect(grid).toBeInTheDocument();
  });

  it('disables the controls during initial loading (SPEC §6)', () => {
    render(<InventoryPage />);
    const searchInput = screen.getByLabelText('Search plants');
    expect(searchInput).toBeDisabled();
    const sortBtn = screen.getByRole('button', { name: 'Sort plants' });
    expect(sortBtn).toBeDisabled();
  });
});

describe('InventoryPage — search/filter/sort wiring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initial fetch is called with no search/status/sort params (defaults)', async () => {
    const fetchPlants = vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, total: 0 },
      status_counts: { all: 0, overdue: 0, due_today: 0, on_track: 0 },
    });
    __usePlantsState = { ...defaultUsePlantsState(), fetchPlants };
    render(<InventoryPage />);

    expect(fetchPlants).toHaveBeenCalledTimes(1);
    const callArgs = fetchPlants.mock.calls[0][0];
    expect(callArgs).toEqual({});
  });

  it('typing in the search bar fires fetchPlants with the trimmed `search` param after debounce', async () => {
    const fetchPlants = vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, total: 0 },
      status_counts: { all: 0, overdue: 0, due_today: 0, on_track: 0 },
    });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      fetchPlants,
      pagination: { page: 1, limit: 50, total: 0 },
      statusCounts: { all: 0, overdue: 0, due_today: 0, on_track: 0 },
    };
    render(<InventoryPage />);
    fetchPlants.mockClear();

    const input = screen.getByLabelText('Search plants');
    fireEvent.change(input, { target: { value: 'fern' } });

    act(() => { vi.advanceTimersByTime(300); });
    await Promise.resolve();

    expect(fetchPlants).toHaveBeenCalled();
    const lastCall = fetchPlants.mock.calls.at(-1)[0];
    expect(lastCall.search).toBe('fern');
  });

  it('clicking a status tab fires fetchPlants with the corresponding `status` param', () => {
    const fetchPlants = vi.fn().mockResolvedValue({ data: [], pagination: null, status_counts: null });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      fetchPlants,
      statusCounts: { all: 12, overdue: 3, due_today: 2, on_track: 7 },
    };
    render(<InventoryPage />);
    fetchPlants.mockClear();

    fireEvent.click(screen.getByLabelText('Overdue plants, 3 results'));
    expect(fetchPlants).toHaveBeenCalled();
    const last = fetchPlants.mock.calls.at(-1)[0];
    expect(last.status).toBe('overdue');
  });

  it('selecting a sort option fires fetchPlants with the `sort` param', () => {
    const fetchPlants = vi.fn().mockResolvedValue({ data: [], pagination: null });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      fetchPlants,
    };
    render(<InventoryPage />);
    fetchPlants.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Sort plants' }));
    fireEvent.click(screen.getByRole('option', { name: 'Most overdue first' }));

    expect(fetchPlants).toHaveBeenCalled();
    const last = fetchPlants.mock.calls.at(-1)[0];
    expect(last.sort).toBe('most_overdue');
  });

  it('combined params: search + status + sort all flow into fetchPlants', () => {
    const fetchPlants = vi.fn().mockResolvedValue({ data: [], pagination: null });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      fetchPlants,
      statusCounts: { all: 12, overdue: 3, due_today: 2, on_track: 7 },
    };
    render(<InventoryPage />);
    fetchPlants.mockClear();

    // Set search.
    fireEvent.change(screen.getByLabelText('Search plants'), { target: { value: 'cactus' } });
    act(() => { vi.advanceTimersByTime(300); });

    // Set status.
    fireEvent.click(screen.getByLabelText('Due today plants, 2 results'));

    // Set sort.
    fireEvent.click(screen.getByRole('button', { name: 'Sort plants' }));
    fireEvent.click(screen.getByRole('option', { name: 'Next due soonest' }));

    const last = fetchPlants.mock.calls.at(-1)[0];
    expect(last.search).toBe('cactus');
    expect(last.status).toBe('due_today');
    expect(last.sort).toBe('next_due_soonest');
  });
});

describe('InventoryPage — Clear filters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render Clear filters when all controls are at defaults', () => {
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      plants: [{ id: '1', name: 'Fern', care_schedules: [] }],
      pagination: { page: 1, limit: 50, total: 1 },
      statusCounts: { all: 1, overdue: 0, due_today: 0, on_track: 1 },
    };
    render(<InventoryPage />);
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('renders Clear filters when search is non-empty and resets all three controls', () => {
    const fetchPlants = vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'Fern', care_schedules: [] }],
      pagination: { page: 1, limit: 50, total: 1 },
      status_counts: { all: 1, overdue: 0, due_today: 0, on_track: 1 },
    });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      fetchPlants,
      plants: [{ id: '1', name: 'Fern', care_schedules: [] }],
      pagination: { page: 1, limit: 50, total: 1 },
      statusCounts: { all: 1, overdue: 0, due_today: 0, on_track: 1 },
    };
    render(<InventoryPage />);

    // Simulate a search to make Clear filters appear.
    fireEvent.change(screen.getByLabelText('Search plants'), { target: { value: 'fern' } });
    act(() => { vi.advanceTimersByTime(300); });

    const clearLinks = screen.getAllByText('Clear filters');
    expect(clearLinks.length).toBeGreaterThanOrEqual(1);

    fetchPlants.mockClear();
    fireEvent.click(clearLinks[0]);

    expect(screen.getByLabelText('Search plants').value).toBe('');
    expect(fetchPlants).toHaveBeenCalled();
    const last = fetchPlants.mock.calls.at(-1)[0];
    expect(last.search).toBeUndefined();
    expect(last.status).toBeUndefined();
    expect(last.sort).toBeUndefined();
  });
});

describe('InventoryPage — empty states (SPEC §5)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('§5d — empty inventory CTA when no plants and no filter', async () => {
    const fetchPlants = vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, total: 0 },
      status_counts: { all: 0, overdue: 0, due_today: 0, on_track: 0 },
    });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      plants: [],
      fetchPlants,
      pagination: { page: 1, limit: 50, total: 0 },
      statusCounts: { all: 0, overdue: 0, due_today: 0, on_track: 0 },
    };
    render(<InventoryPage />);
    // Wait a microtask for the initial fetch promise to settle and
    // initialLoaded to flip to true.
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('Your garden is waiting.')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Plant')).toBeInTheDocument();
  });

  it('§5a — search empty state shows "No plants match your search." with Clear filters', () => {
    const fetchPlants = vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, total: 0 },
      status_counts: { all: 0, overdue: 0, due_today: 0, on_track: 0 },
    });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      plants: [],
      fetchPlants,
      pagination: { page: 1, limit: 50, total: 0 },
      statusCounts: { all: 0, overdue: 0, due_today: 0, on_track: 0 },
    };
    render(<InventoryPage />);
    fireEvent.change(screen.getByLabelText('Search plants'), { target: { value: 'xyz' } });
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.getByText('No plants match your search.')).toBeInTheDocument();
    expect(screen.getAllByText('Clear filters').length).toBeGreaterThanOrEqual(1);
  });

  it('§5b — filter-only empty state ("No overdue plants.") with Clear filters', () => {
    const fetchPlants = vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, total: 0 },
      status_counts: { all: 5, overdue: 0, due_today: 1, on_track: 4 },
    });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      plants: [],
      fetchPlants,
      pagination: { page: 1, limit: 50, total: 0 },
      statusCounts: { all: 5, overdue: 0, due_today: 1, on_track: 4 },
    };
    render(<InventoryPage />);
    fireEvent.click(screen.getByLabelText('Overdue plants, 0 results'));

    expect(screen.getByText('No overdue plants.')).toBeInTheDocument();
    expect(screen.getAllByText('Clear filters').length).toBeGreaterThanOrEqual(1);
  });

  it('§5c — combined search + filter empty state', () => {
    const fetchPlants = vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, total: 0 },
      status_counts: { all: 5, overdue: 0, due_today: 0, on_track: 5 },
    });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      plants: [],
      fetchPlants,
      pagination: { page: 1, limit: 50, total: 0 },
      statusCounts: { all: 5, overdue: 0, due_today: 0, on_track: 5 },
    };
    render(<InventoryPage />);

    // Set search.
    fireEvent.change(screen.getByLabelText('Search plants'), { target: { value: 'fern' } });
    act(() => { vi.advanceTimersByTime(300); });
    // Set filter.
    fireEvent.click(screen.getByLabelText('Overdue plants, 0 results'));

    expect(screen.getByText('No overdue plants match your search.')).toBeInTheDocument();
  });
});

describe('InventoryPage — accessibility / live region', () => {
  // No fake timers in this block — we rely on natural microtask flushing.

  it('renders an aria-live="polite" results region', () => {
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      plants: [{ id: '1', name: 'Fern', care_schedules: [] }],
      pagination: { page: 1, limit: 50, total: 1 },
      statusCounts: { all: 1, overdue: 0, due_today: 0, on_track: 1 },
    };
    render(<InventoryPage />);
    const live = screen.getByTestId('inv-live-region');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveAttribute('aria-atomic', 'true');
  });

  it('live region announces the result count after initial load', async () => {
    const fetchPlants = vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'Fern', care_schedules: [] }],
      pagination: { page: 1, limit: 50, total: 5 },
      status_counts: { all: 5, overdue: 0, due_today: 0, on_track: 5 },
    });
    __usePlantsState = {
      ...defaultUsePlantsState(),
      loading: false,
      plants: [{ id: '1', name: 'Fern', care_schedules: [] }],
      pagination: { page: 1, limit: 50, total: 5 },
      statusCounts: { all: 5, overdue: 0, due_today: 0, on_track: 5 },
      fetchPlants,
    };
    render(<InventoryPage />);
    // Allow the initial fetch promise to settle so initialLoaded flips.
    await act(async () => { await Promise.resolve(); });

    const live = screen.getByTestId('inv-live-region');
    await waitFor(() => {
      expect(live.textContent).toMatch(/5/);
    });
  });
});
