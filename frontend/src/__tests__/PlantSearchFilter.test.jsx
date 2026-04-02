import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PlantSearchFilter, {
  SearchEmptyState,
  FilterEmptyState,
  CombinedEmptyState,
  SkeletonGrid,
} from '../components/PlantSearchFilter.jsx';

vi.mock('@phosphor-icons/react', () => ({
  MagnifyingGlass: (props) => <span data-testid="icon-search" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  WarningCircle: (props) => <span data-testid="icon-warning" {...props} />,
  CheckCircle: (props) => <span data-testid="icon-check" {...props} />,
}));

const defaultProps = {
  searchQuery: '',
  onSearchChange: vi.fn(),
  statusFilter: null,
  onStatusChange: vi.fn(),
  totalCount: 10,
  isFiltered: false,
  fetchError: null,
  onRetry: vi.fn(),
  onClearSearch: vi.fn(),
  onResetFilter: vi.fn(),
};

describe('PlantSearchFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test 1: Search input debounce
  it('debounces search input and fires onSearchChange after 300ms', async () => {
    const onSearchChange = vi.fn();
    render(<PlantSearchFilter {...defaultProps} onSearchChange={onSearchChange} />);

    const input = screen.getByLabelText('Search plants');
    fireEvent.change(input, { target: { value: 'pothos' } });

    // Should NOT have called yet
    expect(onSearchChange).not.toHaveBeenCalled();

    // Advance timer by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearchChange).toHaveBeenCalledWith('pothos');
  });

  // Test 2: Status filter click fires immediately
  it('fires onStatusChange immediately when filter tab is clicked', () => {
    const onStatusChange = vi.fn();
    render(<PlantSearchFilter {...defaultProps} onStatusChange={onStatusChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Overdue' }));
    expect(onStatusChange).toHaveBeenCalledWith('overdue');
  });

  // Test 3: Combined search + filter
  it('allows combined search and filter simultaneously', () => {
    const onSearchChange = vi.fn();
    const onStatusChange = vi.fn();
    render(
      <PlantSearchFilter
        {...defaultProps}
        searchQuery="spider"
        onSearchChange={onSearchChange}
        statusFilter="due_today"
        onStatusChange={onStatusChange}
        isFiltered={true}
        totalCount={2}
      />
    );

    // Filter tab should be active
    expect(screen.getByRole('tab', { name: 'Due Today' })).toHaveAttribute('aria-selected', 'true');
    // Result count should be visible
    expect(screen.getByText('Showing 2 plants')).toBeInTheDocument();
  });

  // Test 4: Clear button clears search and refocuses input
  it('clears search on ✕ click and refocuses input', () => {
    const onClearSearch = vi.fn();
    render(
      <PlantSearchFilter
        {...defaultProps}
        searchQuery="pothos"
        onClearSearch={onClearSearch}
        isFiltered={true}
      />
    );

    const clearBtn = screen.getByLabelText('Clear search');
    fireEvent.click(clearBtn);

    expect(onClearSearch).toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByLabelText('Search plants'));
  });

  // Test 5: Skeleton grid renders during loading
  it('renders skeleton grid with aria-busy', () => {
    render(<SkeletonGrid />);
    const grid = document.querySelector('[aria-busy="true"]');
    expect(grid).toBeInTheDocument();
    // Should have 6 skeleton cards
    const cards = document.querySelectorAll('.psf-skeleton-card');
    expect(cards.length).toBe(6);
  });

  // Test 6: Clicking All resets filter
  it('fires onStatusChange(null) when All tab is clicked from active filter', () => {
    const onStatusChange = vi.fn();
    render(
      <PlantSearchFilter
        {...defaultProps}
        statusFilter="overdue"
        onStatusChange={onStatusChange}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'All' }));
    expect(onStatusChange).toHaveBeenCalledWith(null);
  });

  // Test 7: Result count pluralization
  it('pluralizes result count correctly', () => {
    const { rerender } = render(
      <PlantSearchFilter {...defaultProps} isFiltered={true} totalCount={1} />
    );
    expect(screen.getByText('Showing 1 plant')).toBeInTheDocument();

    rerender(
      <PlantSearchFilter {...defaultProps} isFiltered={true} totalCount={3} />
    );
    expect(screen.getByText('Showing 3 plants')).toBeInTheDocument();
  });

  // Test 8: Result count hidden when no filters active
  it('hides result count when no filters are active', () => {
    render(<PlantSearchFilter {...defaultProps} isFiltered={false} />);
    const countEl = document.querySelector('.psf-result-count');
    expect(countEl).not.toHaveClass('psf-result-count--visible');
  });

  // Test 9: Error banner renders on fetch error
  it('shows error banner when fetchError is set', () => {
    render(<PlantSearchFilter {...defaultProps} fetchError="Network error" />);
    expect(screen.getByText('Could not load plants. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  // Test 10: Clicking active tab does not re-fire
  it('does not fire onStatusChange when clicking the already active tab', () => {
    const onStatusChange = vi.fn();
    render(
      <PlantSearchFilter
        {...defaultProps}
        statusFilter={null}
        onStatusChange={onStatusChange}
      />
    );

    // "All" is default active
    fireEvent.click(screen.getByRole('tab', { name: 'All' }));
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});

describe('SearchEmptyState', () => {
  it('renders search empty state with clear button', () => {
    const onClear = vi.fn();
    render(<SearchEmptyState onClear={onClear} />);
    expect(screen.getByText('No plants match your search.')).toBeInTheDocument();
    expect(screen.getByText('Clear search')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear search'));
    expect(onClear).toHaveBeenCalled();
  });
});

describe('FilterEmptyState', () => {
  it('renders overdue empty state', () => {
    render(<FilterEmptyState statusFilter="overdue" onReset={vi.fn()} />);
    expect(screen.getByText('No plants are overdue.')).toBeInTheDocument();
  });

  it('renders due today empty state', () => {
    render(<FilterEmptyState statusFilter="due_today" onReset={vi.fn()} />);
    expect(screen.getByText('Nothing is due today.')).toBeInTheDocument();
  });

  it('renders on track empty state', () => {
    render(<FilterEmptyState statusFilter="on_track" onReset={vi.fn()} />);
    expect(screen.getByText('No plants are fully on track yet.')).toBeInTheDocument();
  });
});

describe('CombinedEmptyState', () => {
  it('renders combined empty state with both buttons', () => {
    const onClearSearch = vi.fn();
    const onResetFilter = vi.fn();
    render(<CombinedEmptyState onClearSearch={onClearSearch} onResetFilter={onResetFilter} />);
    expect(screen.getByText('No plants match your search and filter.')).toBeInTheDocument();
    expect(screen.getByText('Clear search')).toBeInTheDocument();
    expect(screen.getByText('Reset filter')).toBeInTheDocument();
  });
});
