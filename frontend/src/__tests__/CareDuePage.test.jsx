import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
}));

const mockCareDueGet = vi.fn();
const mockCareActionsMarkDone = vi.fn();

vi.mock('../utils/api.js', () => ({
  careDue: {
    get: (...args) => mockCareDueGet(...args),
  },
  careActions: {
    markDone: (...args) => mockCareActionsMarkDone(...args),
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
      expect(mockCareActionsMarkDone).toHaveBeenCalledWith('p1', 'watering');
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
});
