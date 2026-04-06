import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RemindersSection from '../components/RemindersSection.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Bell: (props) => <span data-testid="icon-bell" {...props} />,
  CheckCircle: (props) => <span data-testid="icon-check" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

const mockAddToast = vi.fn();
vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

const mockGet = vi.fn();
const mockUpdate = vi.fn();
vi.mock('../utils/api.js', () => ({
  notificationPreferences: {
    get: (...args) => mockGet(...args),
    update: (...args) => mockUpdate(...args),
  },
}));

describe('RemindersSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with aria-busy', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<RemindersSection />);
    const section = document.querySelector('.reminders-section');
    expect(section).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Reminders')).toBeInTheDocument();
  });

  it('renders with preferences loaded (opt_in=false)', async () => {
    mockGet.mockResolvedValue({ opt_in: false, reminder_hour_utc: 8 });
    render(<RemindersSection />);
    await waitFor(() => {
      const section = document.querySelector('.reminders-section');
      expect(section).toHaveAttribute('aria-busy', 'false');
    });
    const toggle = screen.getByRole('switch', { name: 'Email reminders' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    // Timing selector wrapper should exist but be collapsed (aria-hidden)
    const timingWrapper = document.querySelector('.reminders-timing-wrapper');
    expect(timingWrapper).toBeInTheDocument();
    expect(timingWrapper).not.toHaveClass('reminders-timing-wrapper--open');
    // Save button should not be visible
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });

  it('renders with preferences loaded (opt_in=true, hour=12)', async () => {
    mockGet.mockResolvedValue({ opt_in: true, reminder_hour_utc: 12 });
    render(<RemindersSection />);
    await waitFor(() => {
      const toggle = screen.getByRole('switch', { name: 'Email reminders' });
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
    // Midday should be checked
    const middayRadio = screen.getByRole('radio', { name: /midday/i });
    expect(middayRadio).toBeChecked();
    // Save button visible
    expect(screen.getByRole('button', { name: 'Save reminder settings' })).toBeInTheDocument();
  });

  it('shows load error when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<RemindersSection />);
    await waitFor(() => {
      expect(screen.getByText('Could not load your current settings.')).toBeInTheDocument();
    });
    // Toggle defaults to off
    const toggle = screen.getByRole('switch', { name: 'Email reminders' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles on and shows timing selector and save button', async () => {
    mockGet.mockResolvedValue({ opt_in: false, reminder_hour_utc: 8 });
    render(<RemindersSection />);
    await waitFor(() => {
      const section = document.querySelector('.reminders-section');
      expect(section).toHaveAttribute('aria-busy', 'false');
    });
    const toggle = screen.getByRole('switch', { name: 'Email reminders' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    // Save button should appear
    expect(screen.getByRole('button', { name: 'Save reminder settings' })).toBeInTheDocument();
    // Timing wrapper should be open
    const wrapper = document.querySelector('.reminders-timing-wrapper--open');
    expect(wrapper).toBeInTheDocument();
  });

  it('saves preferences and shows success toast', async () => {
    mockGet.mockResolvedValue({ opt_in: false, reminder_hour_utc: 8 });
    mockUpdate.mockResolvedValue({ opt_in: true, reminder_hour_utc: 12 });
    render(<RemindersSection />);
    await waitFor(() => {
      const section = document.querySelector('.reminders-section');
      expect(section).toHaveAttribute('aria-busy', 'false');
    });
    // Toggle on
    fireEvent.click(screen.getByRole('switch', { name: 'Email reminders' }));
    // Select Midday
    fireEvent.click(screen.getByRole('radio', { name: /midday/i }));
    // Save
    fireEvent.click(screen.getByRole('button', { name: 'Save reminder settings' }));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ opt_in: true, reminder_hour_utc: 12 });
      expect(mockAddToast).toHaveBeenCalledWith('Reminder settings saved', 'success');
    });
  });

  it('shows save error on API failure', async () => {
    mockGet.mockResolvedValue({ opt_in: true, reminder_hour_utc: 8 });
    mockUpdate.mockRejectedValue(new Error('Server error'));
    render(<RemindersSection />);
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Email reminders' })).toHaveAttribute('aria-checked', 'true');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save reminder settings' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Couldn't save your settings/)).toBeInTheDocument();
    });
  });

  it('dismisses save error when X is clicked', async () => {
    mockGet.mockResolvedValue({ opt_in: true, reminder_hour_utc: 8 });
    mockUpdate.mockRejectedValue(new Error('fail'));
    render(<RemindersSection />);
    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save reminder settings' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows "Save changes" label when toggling off from on state', async () => {
    mockGet.mockResolvedValue({ opt_in: true, reminder_hour_utc: 8 });
    render(<RemindersSection />);
    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
    // Toggle off
    fireEvent.click(screen.getByRole('switch', { name: 'Email reminders' }));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('sends opt_in=false toast message on save-off', async () => {
    mockGet.mockResolvedValue({ opt_in: true, reminder_hour_utc: 8 });
    mockUpdate.mockResolvedValue({ opt_in: false, reminder_hour_utc: 8 });
    render(<RemindersSection />);
    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
    fireEvent.click(screen.getByRole('switch', { name: 'Email reminders' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ opt_in: false, reminder_hour_utc: 8 });
      expect(mockAddToast).toHaveBeenCalledWith('Email reminders turned off', 'success');
    });
  });

  it('has proper accessibility attributes on toggle', async () => {
    mockGet.mockResolvedValue({ opt_in: false, reminder_hour_utc: 8 });
    render(<RemindersSection />);
    await waitFor(() => {
      const section = document.querySelector('.reminders-section');
      expect(section).toHaveAttribute('aria-busy', 'false');
    });
    const toggle = screen.getByRole('switch', { name: 'Email reminders' });
    expect(toggle).toHaveAttribute('aria-describedby', 'reminder-toggle-desc');
    expect(document.getElementById('reminder-toggle-desc')).toBeInTheDocument();
  });

  it('has proper radiogroup with accessible label', async () => {
    mockGet.mockResolvedValue({ opt_in: true, reminder_hour_utc: 18 });
    render(<RemindersSection />);
    await waitFor(() => {
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });
    const radiogroup = screen.getByRole('radiogroup', { name: 'Reminder time' });
    expect(radiogroup).toBeInTheDocument();
    // Evening should be checked
    const eveningRadio = screen.getByRole('radio', { name: /evening/i });
    expect(eveningRadio).toBeChecked();
  });
});
