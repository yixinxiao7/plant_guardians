import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import CareDuePage from '../pages/CareDuePage.jsx';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useOutletContext: () => ({ onBadgeUpdate: mockOnBadgeUpdate }),
}));

const mockOnBadgeUpdate = vi.fn();

vi.mock('@phosphor-icons/react', () => ({
  WarningCircle: (props) => <span data-testid="icon-warning" {...props} />,
  Clock: (props) => <span data-testid="icon-clock" {...props} />,
  CalendarBlank: (props) => <span data-testid="icon-calendar" {...props} />,
  Drop: (props) => <span data-testid="icon-drop" {...props} />,
  Leaf: (props) => <span data-testid="icon-leaf" {...props} />,
  PottedPlant: (props) => <span data-testid="icon-potted" {...props} />,
  PencilSimple: (props) => <span data-testid="icon-pencil" {...props} />,
  CheckCircle: (props) => <span data-testid="icon-check-circle" {...props} />,
}));

const mockCareDueGet = vi.fn();
const mockCareActionsMarkDone = vi.fn();
const mockCareActionsBatch = vi.fn();

vi.mock('../utils/api.js', () => ({
  careDue: {
    get: (...args) => mockCareDueGet(...args),
  },
  careActions: {
    markDone: (...args) => mockCareActionsMarkDone(...args),
    batch: (...args) => mockCareActionsBatch(...args),
  },
}));

vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

const mockAddToast = vi.fn();

const sampleData = {
  overdue: [
    {
      plant_id: 'p1',
      plant_name: 'Monstera',
      care_type: 'watering',
      days_overdue: 3,
      last_done_at: '2026-03-24T08:00:00.000Z',
    },
    {
      plant_id: 'p2',
      plant_name: 'Pothos',
      care_type: 'fertilizing',
      days_overdue: 1,
      last_done_at: null,
    },
  ],
  due_today: [
    {
      plant_id: 'p3',
      plant_name: 'Snake Plant',
      care_type: 'watering',
    },
  ],
  upcoming: [
    {
      plant_id: 'p4',
      plant_name: 'Fiddle Leaf Fig',
      care_type: 'repotting',
      due_in_days: 3,
      due_date: '2026-03-30',
    },
    {
      plant_id: 'p5',
      plant_name: 'Aloe Vera',
      care_type: 'watering',
      due_in_days: 1,
      due_date: '2026-03-28',
    },
  ],
};

const emptyData = {
  overdue: [],
  due_today: [],
  upcoming: [],
};

describe('CareDuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Loading State ---
  it('renders loading skeleton initially', () => {
    mockCareDueGet.mockReturnValue(new Promise(() => {}));
    render(<CareDuePage />);
    expect(screen.getByText('Care Due')).toBeInTheDocument();
    expect(screen.getByText('Plants that need your attention, sorted by urgency.')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading care due items')).toBeInTheDocument();
  });

  // --- Error State ---
  it('renders error state on API failure', async () => {
    mockCareDueGet.mockRejectedValue(new Error('Network error'));
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText("Couldn't load your care schedule.")).toBeInTheDocument();
    });
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.getByLabelText('Retry loading care due items')).toBeInTheDocument();
  });

  it('retries fetch on "Try again" click', async () => {
    mockCareDueGet
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(sampleData);

    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText("Couldn't load your care schedule.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Retry loading care due items'));

    await waitFor(() => {
      expect(mockCareDueGet).toHaveBeenCalledTimes(2);
    });
  });

  // --- All-Clear State ---
  it('renders all-clear state when all sections empty', async () => {
    mockCareDueGet.mockResolvedValue(emptyData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('All your plants are happy!')).toBeInTheDocument();
    });
    expect(screen.getByText("You're all caught up. Check back later or explore your plant inventory.")).toBeInTheDocument();
    expect(screen.getByText('View my plants')).toBeInTheDocument();
  });

  it('navigates to inventory on all-clear CTA click', async () => {
    mockCareDueGet.mockResolvedValue(emptyData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('View my plants')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('View my plants'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // --- Populated State ---
  it('renders all three sections with items', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    });
    expect(screen.getByText('DUE TODAY')).toBeInTheDocument();
    expect(screen.getByText('COMING UP')).toBeInTheDocument();

    // Plant names
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Pothos')).toBeInTheDocument();
    expect(screen.getByText('Snake Plant')).toBeInTheDocument();
    expect(screen.getByText('Fiddle Leaf Fig')).toBeInTheDocument();
    expect(screen.getByText('Aloe Vera')).toBeInTheDocument();
  });

  it('displays correct urgency text for overdue items', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('3 days overdue')).toBeInTheDocument();
    });
    // Pothos has last_done_at: null
    expect(screen.getByText('Never done')).toBeInTheDocument();
  });

  it('displays correct urgency text for due today items', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('Due today')).toBeInTheDocument();
    });
  });

  it('displays correct urgency text for upcoming items', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('Due in 3 days')).toBeInTheDocument();
    });
    expect(screen.getByText('Due tomorrow')).toBeInTheDocument();
  });

  it('displays singular "day overdue" for 1 day', async () => {
    mockCareDueGet.mockResolvedValue({
      ...emptyData,
      overdue: [{
        plant_id: 'p1',
        plant_name: 'Test',
        care_type: 'watering',
        days_overdue: 1,
        last_done_at: '2026-03-26T00:00:00.000Z',
      }],
    });
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('1 day overdue')).toBeInTheDocument();
    });
  });

  it('shows section count pills', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    });
    // Count pills — 2 overdue, 1 due today, 2 upcoming
    const countPills = document.querySelectorAll('.care-due-section-count');
    expect(countPills[0].textContent).toBe('2');
    expect(countPills[1].textContent).toBe('1');
    expect(countPills[2].textContent).toBe('2');
  });

  it('shows per-section empty state when one section has no items', async () => {
    const dataPartialEmpty = {
      overdue: sampleData.overdue,
      due_today: [],
      upcoming: sampleData.upcoming,
    };
    mockCareDueGet.mockResolvedValue(dataPartialEmpty);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('Nothing due today.')).toBeInTheDocument();
    });
  });

  // --- Mark as Done ---
  it('marks item as done and removes from list', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    mockCareActionsMarkDone.mockResolvedValue({});
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    const markDoneBtn = screen.getByLabelText('Mark Monstera watering as done');
    fireEvent.click(markDoneBtn);

    await waitFor(() => {
      expect(mockCareActionsMarkDone).toHaveBeenCalledWith('p1', 'watering', null);
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Monstera watering marked as done! 🌿',
        'success'
      );
    });
  });

  it('shows error toast when mark-done fails', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    mockCareActionsMarkDone.mockRejectedValue(new Error('fail'));
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        "Couldn't mark as done. Please try again.",
        'error'
      );
    });
  });

  it('disables button while mark-done is in flight', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    mockCareActionsMarkDone.mockReturnValue(new Promise(() => {})); // never resolves
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    const btn = screen.getByLabelText('Mark Monstera watering as done');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(btn).toBeDisabled();
    });
  });

  // --- Badge Update ---
  it('calls onBadgeUpdate with correct count', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      // badgeCount = overdue(2) + due_today(1) = 3
      expect(mockOnBadgeUpdate).toHaveBeenCalledWith(3);
    });
  });

  it('updates badge after mark-done', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    mockCareActionsMarkDone.mockResolvedValue({});
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('Monstera')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));

    await waitFor(() => {
      // After removing one overdue item: overdue(1) + due_today(1) = 2
      expect(mockOnBadgeUpdate).toHaveBeenCalledWith(2);
    });
  });

  // --- Accessibility ---
  it('has proper section headings and aria-labelledby', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    });

    const sections = document.querySelectorAll('section');
    expect(sections.length).toBe(3);

    sections.forEach((section) => {
      const labelledBy = section.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      const heading = section.querySelector(`#${labelledBy}`);
      expect(heading).toBeTruthy();
    });
  });

  it('renders mark-done buttons with descriptive aria-labels', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByLabelText('Mark Monstera watering as done')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Mark Pothos fertilizing as done')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark Snake Plant watering as done')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark Fiddle Leaf Fig repotting as done')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark Aloe Vera watering as done')).toBeInTheDocument();
  });

  // --- Tooltip for upcoming items ---
  it('shows due date tooltip on upcoming urgency text', async () => {
    mockCareDueGet.mockResolvedValue(sampleData);
    render(<CareDuePage />);
    await waitFor(() => {
      expect(screen.getByText('Due in 3 days')).toBeInTheDocument();
    });
    expect(screen.getByText('Due in 3 days').getAttribute('title')).toContain('March 30, 2026');
  });

  // --- Focus Management After Mark-Done (T-050) ---
  // Helper: mock prefers-reduced-motion
  const mockReducedMotion = (reduced) => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reduced : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  };

  describe('Focus management after mark-done (T-050)', () => {
    beforeEach(() => {
      // Default: standard motion (no reduced-motion preference)
      mockReducedMotion(false);
    });

    it('focuses next sibling mark-done button when middle overdue item is removed', async () => {
      // Overdue has 2 items: Monstera (idx 0), Pothos (idx 1)
      // Removing Monstera (idx 0) → Pothos (now idx 0) should receive focus
      mockCareDueGet.mockResolvedValue(sampleData);
      mockCareActionsMarkDone.mockResolvedValue({});
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Monstera')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));

      await waitFor(() => {
        const pothosBtn = screen.getByLabelText('Mark Pothos fertilizing as done');
        expect(document.activeElement).toBe(pothosBtn);
      }, { timeout: 2000 });
    });

    it('focuses first Due Today item when last Overdue item is removed', async () => {
      const dataOneOverdue = {
        overdue: [sampleData.overdue[0]],
        due_today: sampleData.due_today,
        upcoming: sampleData.upcoming,
      };
      mockCareDueGet.mockResolvedValue(dataOneOverdue);
      mockCareActionsMarkDone.mockResolvedValue({});
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Monstera')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));

      await waitFor(() => {
        const snakePlantBtn = screen.getByLabelText('Mark Snake Plant watering as done');
        expect(document.activeElement).toBe(snakePlantBtn);
      }, { timeout: 2000 });
    });

    it('focuses first Coming Up item when last Overdue item removed and Due Today is empty', async () => {
      const dataOverdueAndUpcoming = {
        overdue: [sampleData.overdue[0]],
        due_today: [],
        upcoming: sampleData.upcoming,
      };
      mockCareDueGet.mockResolvedValue(dataOverdueAndUpcoming);
      mockCareActionsMarkDone.mockResolvedValue({});
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Monstera')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));

      await waitFor(() => {
        const fiddleLeafBtn = screen.getByLabelText('Mark Fiddle Leaf Fig repotting as done');
        expect(document.activeElement).toBe(fiddleLeafBtn);
      }, { timeout: 2000 });
    });

    it('focuses first Coming Up item when last Due Today item removed', async () => {
      const dataDueTodayAndUpcoming = {
        overdue: [],
        due_today: sampleData.due_today,
        upcoming: sampleData.upcoming,
      };
      mockCareDueGet.mockResolvedValue(dataDueTodayAndUpcoming);
      mockCareActionsMarkDone.mockResolvedValue({});
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Snake Plant')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Mark Snake Plant watering as done'));

      await waitFor(() => {
        const fiddleLeafBtn = screen.getByLabelText('Mark Fiddle Leaf Fig repotting as done');
        expect(document.activeElement).toBe(fiddleLeafBtn);
      }, { timeout: 2000 });
    });

    it('focuses "View my plants" button when last remaining item is removed (all-clear)', async () => {
      const dataSingleItem = {
        overdue: [{
          plant_id: 'p1',
          plant_name: 'Monstera',
          care_type: 'watering',
          days_overdue: 3,
          last_done_at: '2026-03-24T08:00:00.000Z',
        }],
        due_today: [],
        upcoming: [],
      };
      mockCareDueGet.mockResolvedValue(dataSingleItem);
      mockCareActionsMarkDone.mockResolvedValue({});
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Monstera')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));

      await waitFor(() => {
        const viewBtn = screen.getByText('View my plants');
        expect(document.activeElement).toBe(viewBtn);
      }, { timeout: 2000 });
    });

    it('focuses synchronously (no delay) when prefers-reduced-motion: reduce', async () => {
      mockReducedMotion(true);
      mockCareDueGet.mockResolvedValue(sampleData);
      mockCareActionsMarkDone.mockResolvedValue({});
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Monstera')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));

      // With reduced motion, focus moves synchronously — no 350ms delay needed
      await waitFor(() => {
        const pothosBtn = screen.getByLabelText('Mark Pothos fertilizing as done');
        expect(document.activeElement).toBe(pothosBtn);
      });
    });
  });

  // --- Batch Mark-Done (SPEC-019 / T-110) ---
  describe('Batch mark-done (T-110)', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    // Test 1: Selection mode toggle
    it('enters and exits selection mode when clicking Select/Cancel', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      // No checkboxes initially
      expect(screen.queryByLabelText('Select all care items')).not.toBeInTheDocument();

      // Enter selection mode
      fireEvent.click(screen.getByText('Select'));

      expect(screen.getByLabelText('Select all care items')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      // Checkboxes should appear — one per item (5 items in sampleData)
      const checkboxes = screen.getAllByRole('checkbox');
      // 1 select-all + 5 items = 6
      expect(checkboxes.length).toBe(6);

      // Exit selection mode
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByLabelText('Select all care items')).not.toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    // Test 2: Per-item checkbox
    it('toggles item checkbox when clicking a card in selection mode', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));

      const monsteraCheckbox = screen.getByLabelText('Mark Monstera watering as done');
      expect(monsteraCheckbox.checked).toBe(false);

      // Click the checkbox
      fireEvent.click(monsteraCheckbox);
      expect(monsteraCheckbox.checked).toBe(true);

      // Click again to uncheck
      fireEvent.click(monsteraCheckbox);
      expect(monsteraCheckbox.checked).toBe(false);
    });

    // Test 3: Select all
    it('selects and deselects all items via Select all checkbox', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));

      const selectAll = screen.getByLabelText('Select all care items');
      fireEvent.click(selectAll);

      // All 5 item checkboxes should be checked
      const itemCheckboxes = screen.getAllByRole('checkbox').filter(
        (cb) => cb.getAttribute('aria-label') !== 'Select all care items'
      );
      itemCheckboxes.forEach((cb) => expect(cb.checked).toBe(true));

      // Deselect all
      fireEvent.click(selectAll);
      itemCheckboxes.forEach((cb) => expect(cb.checked).toBe(false));
    });

    // Test 4: Action bar visibility
    it('shows action bar with count when items are selected', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));

      // Action bar exists but no selection yet — should show "0 selected"
      const monsteraCheckbox = screen.getByLabelText('Mark Monstera watering as done');
      fireEvent.click(monsteraCheckbox);

      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByLabelText('Mark 1 selected items as done')).toBeInTheDocument();

      // Select another
      const pothosCheckbox = screen.getByLabelText('Mark Pothos fertilizing as done');
      fireEvent.click(pothosCheckbox);

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    // Test 5: Mark done → Confirmation
    it('shows confirmation when clicking Mark done', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));

      // Select 2 items
      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));
      fireEvent.click(screen.getByLabelText('Mark Pothos fertilizing as done'));

      // Click Mark done
      fireEvent.click(screen.getByLabelText('Mark 2 selected items as done'));

      // Confirmation message
      expect(screen.getByText('Mark 2 items as done?')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    // Test 6: Confirm → API call + success
    it('calls batch API and shows toast on full success', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      mockCareActionsBatch.mockResolvedValue({
        results: [
          { plant_id: 'p1', care_type: 'watering', status: 'created', error: null },
          { plant_id: 'p2', care_type: 'fertilizing', status: 'created', error: null },
        ],
        created_count: 2,
        error_count: 0,
      });
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));
      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));
      fireEvent.click(screen.getByLabelText('Mark Pothos fertilizing as done'));
      fireEvent.click(screen.getByLabelText('Mark 2 selected items as done'));
      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockCareActionsBatch).toHaveBeenCalledTimes(1);
      });

      // Verify API was called with correct shape
      const callArgs = mockCareActionsBatch.mock.calls[0][0];
      expect(callArgs.length).toBe(2);
      expect(callArgs[0].plant_id).toBe('p1');
      expect(callArgs[0].care_type).toBe('watering');
      expect(callArgs[1].plant_id).toBe('p2');
      expect(callArgs[1].care_type).toBe('fertilizing');

      // Success toast
      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith('2 care actions marked done', 'success');
      });
    });

    // Test 7: Partial failure
    it('shows partial failure message when some items fail', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      mockCareActionsBatch.mockResolvedValue({
        results: [
          { plant_id: 'p1', care_type: 'watering', status: 'created', error: null },
          { plant_id: 'p2', care_type: 'fertilizing', status: 'error', error: 'Plant not found' },
        ],
        created_count: 1,
        error_count: 1,
      });
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));
      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));
      fireEvent.click(screen.getByLabelText('Mark Pothos fertilizing as done'));
      fireEvent.click(screen.getByLabelText('Mark 2 selected items as done'));
      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.getByText(/1 of 2 marked done/)).toBeInTheDocument();
      });

      expect(screen.getByText(/1 failed/)).toBeInTheDocument();
      expect(screen.getByLabelText('Retry 1 failed items')).toBeInTheDocument();
    });

    // Test 8: Retry sends only failed items
    it('retries only failed items when clicking Retry', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      mockCareActionsBatch
        .mockResolvedValueOnce({
          results: [
            { plant_id: 'p1', care_type: 'watering', status: 'created', error: null },
            { plant_id: 'p2', care_type: 'fertilizing', status: 'error', error: 'Plant not found' },
          ],
          created_count: 1,
          error_count: 1,
        })
        .mockResolvedValueOnce({
          results: [
            { plant_id: 'p2', care_type: 'fertilizing', status: 'created', error: null },
          ],
          created_count: 1,
          error_count: 0,
        });

      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));
      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));
      fireEvent.click(screen.getByLabelText('Mark Pothos fertilizing as done'));
      fireEvent.click(screen.getByLabelText('Mark 2 selected items as done'));
      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.getByLabelText('Retry 1 failed items')).toBeInTheDocument();
      });

      // Click retry → should show confirmation for 1 item
      fireEvent.click(screen.getByLabelText('Retry 1 failed items'));

      await waitFor(() => {
        expect(screen.getByText('Mark 1 item as done?')).toBeInTheDocument();
      });

      // Confirm retry
      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(mockCareActionsBatch).toHaveBeenCalledTimes(2);
      });

      // Second call should only have the failed item
      const retryArgs = mockCareActionsBatch.mock.calls[1][0];
      expect(retryArgs.length).toBe(1);
      expect(retryArgs[0].plant_id).toBe('p2');
      expect(retryArgs[0].care_type).toBe('fertilizing');
    });

    // Test 9: Cancel clears selections
    it('cancels action bar confirmation and header cancel exits selection mode', async () => {
      mockCareDueGet.mockResolvedValue(sampleData);
      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));
      fireEvent.click(screen.getByLabelText('Mark Monstera watering as done'));

      // Click Mark done (1 selected)
      fireEvent.click(screen.getByLabelText('Mark 1 selected items as done'));

      // Confirmation should be showing
      expect(screen.getByText('Mark 1 item as done?')).toBeInTheDocument();

      // Cancel in the action bar (returns to idle, keeps selections)
      const cancelButtons = screen.getAllByText('Cancel');
      // The last Cancel is in the action bar
      const actionBarCancel = cancelButtons[cancelButtons.length - 1];
      fireEvent.click(actionBarCancel);

      // Should be back to idle with count still showing
      expect(screen.getByText('1 selected')).toBeInTheDocument();

      // Now click header Cancel to exit selection mode entirely
      fireEvent.click(screen.getByText('Cancel'));

      // Back to normal mode
      expect(screen.queryByLabelText('Select all care items')).not.toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    // Test 10: Empty state after all items marked done
    it('shows empty state when all items are batch-marked done', async () => {
      const smallData = {
        overdue: [
          {
            plant_id: 'p1',
            plant_name: 'Monstera',
            care_type: 'watering',
            days_overdue: 3,
            last_done_at: '2026-03-24T08:00:00.000Z',
          },
        ],
        due_today: [],
        upcoming: [],
      };
      mockCareDueGet
        .mockResolvedValueOnce(smallData)
        .mockResolvedValueOnce(emptyData); // After batch, re-fetch returns empty

      mockCareActionsBatch.mockResolvedValue({
        results: [
          { plant_id: 'p1', care_type: 'watering', status: 'created', error: null },
        ],
        created_count: 1,
        error_count: 0,
      });

      render(<CareDuePage />);
      await waitFor(() => {
        expect(screen.getByText('Select')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select'));
      fireEvent.click(screen.getByLabelText('Select all care items'));
      fireEvent.click(screen.getByLabelText('Mark 1 selected items as done'));
      fireEvent.click(screen.getByText('Confirm'));

      // After success, fetchCareDue is called again and returns emptyData
      await waitFor(() => {
        expect(screen.getByText('All your plants are happy!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
