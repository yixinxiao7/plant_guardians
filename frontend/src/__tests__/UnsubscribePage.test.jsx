import { render, screen, waitFor } from '@testing-library/react';
import UnsubscribePage from '../pages/UnsubscribePage.jsx';

// Mock react-router-dom
const mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams],
}));

vi.mock('@phosphor-icons/react', () => ({
  Plant: (props) => <span data-testid="icon-plant" {...props} />,
  CheckCircle: (props) => <span data-testid="icon-check" {...props} />,
  Warning: (props) => <span data-testid="icon-warning" {...props} />,
}));

// Mock API
const mockUnsubscribe = vi.fn();
vi.mock('../utils/api.js', () => ({
  notificationPreferences: {
    unsubscribe: (...args) => mockUnsubscribe(...args),
  },
}));

describe('UnsubscribePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset search params
    for (const key of [...mockSearchParams.keys()]) {
      mockSearchParams.delete(key);
    }
  });

  it('shows loading state on mount with valid params', () => {
    mockSearchParams.set('token', 'abc123');
    mockSearchParams.set('uid', 'user-1');
    mockUnsubscribe.mockReturnValue(new Promise(() => {})); // never resolves

    render(<UnsubscribePage />);
    expect(screen.getByText('Processing your request…')).toBeInTheDocument();
  });

  it('shows success state after successful unsubscribe', async () => {
    mockSearchParams.set('token', 'abc123');
    mockSearchParams.set('uid', 'user-1');
    mockUnsubscribe.mockResolvedValue({ message: 'Unsubscribed' });

    render(<UnsubscribePage />);

    await waitFor(() => {
      expect(screen.getByText("You've been unsubscribed")).toBeInTheDocument();
    });

    expect(screen.getByText(/You won't receive any more care reminder emails/)).toBeInTheDocument();
    expect(screen.getByText('Go to Plant Guardians')).toBeInTheDocument();
  });

  it('passes both token and uid to the API', async () => {
    mockSearchParams.set('token', 'abc123');
    mockSearchParams.set('uid', 'user-1');
    mockUnsubscribe.mockResolvedValue({});

    render(<UnsubscribePage />);

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalledWith('abc123', 'user-1');
    });
  });

  it('shows error state when token is missing', () => {
    // No token or uid set
    render(<UnsubscribePage />);
    expect(screen.getByText('Link not valid')).toBeInTheDocument();
    expect(screen.getByText(/This unsubscribe link may have already been used/)).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows error state when uid is missing', () => {
    mockSearchParams.set('token', 'abc123');
    // No uid set
    render(<UnsubscribePage />);
    expect(screen.getByText('Link not valid')).toBeInTheDocument();
  });

  it('shows error state on INVALID_TOKEN API error', async () => {
    mockSearchParams.set('token', 'bad-token');
    mockSearchParams.set('uid', 'user-1');
    mockUnsubscribe.mockRejectedValue({ code: 'INVALID_TOKEN', message: 'Invalid token' });

    render(<UnsubscribePage />);

    await waitFor(() => {
      expect(screen.getByText('Link not valid')).toBeInTheDocument();
    });
    expect(screen.getByText(/This unsubscribe link may have already been used/)).toBeInTheDocument();
  });

  it('shows generic error on server failure', async () => {
    mockSearchParams.set('token', 'abc123');
    mockSearchParams.set('uid', 'user-1');
    mockUnsubscribe.mockRejectedValue({ code: 'INTERNAL_ERROR', message: 'Server error' });

    render(<UnsubscribePage />);

    await waitFor(() => {
      expect(screen.getByText('Link not valid')).toBeInTheDocument();
    });
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });
});
