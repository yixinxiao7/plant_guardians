import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ShareButton from '../components/ShareButton.jsx';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@phosphor-icons/react', () => ({
  ShareNetwork: (props) => <span data-testid="icon-share" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

const mockAddToast = vi.fn();

vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

const mockCreate = vi.fn();

vi.mock('../utils/api.js', () => ({
  plantShares: {
    create: (...args) => mockCreate(...args),
  },
}));

// Some tests mount the fallback modal, which pulls in Modal / Button. Those
// components are already unit-tested. No additional mocks needed.

beforeEach(() => {
  mockAddToast.mockReset();
  mockCreate.mockReset();
  // Reset navigator.clipboard between tests
  const clipboardWriteText = vi.fn().mockResolvedValue();
  Object.defineProperty(global.navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: clipboardWriteText },
  });
});

// ── Tests ────────────────────────────────────────────────────────────

describe('ShareButton (SPEC-022)', () => {
  it('renders an accessible share button with aria-label', () => {
    render(<ShareButton plantId="plant-1" />);
    const btn = screen.getByRole('button', { name: /share plant/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('calls POST /plants/:id/share and enters loading state while in flight', async () => {
    // Resolve after a microtask so we can observe the loading state.
    let resolvePromise;
    mockCreate.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(<ShareButton plantId="plant-42" />);
    const btn = screen.getByRole('button', { name: /share plant/i });

    fireEvent.click(btn);

    // During the in-flight request, the button should be disabled and
    // announce the loading state.
    await waitFor(() => {
      const loading = screen.getByRole('button', { name: /generating share link/i });
      expect(loading).toBeDisabled();
      expect(loading).toHaveAttribute('aria-busy', 'true');
    });

    expect(mockCreate).toHaveBeenCalledWith('plant-42');

    // Resolve so the test cleans up.
    await act(async () => {
      resolvePromise({ share_url: 'https://example.com/plants/share/tok' });
    });
  });

  it('copies the share URL to the clipboard and fires a "Link copied!" toast', async () => {
    mockCreate.mockResolvedValueOnce({
      share_url: 'https://app.example.com/plants/share/abc123',
    });

    render(<ShareButton plantId="plant-7" />);
    fireEvent.click(screen.getByRole('button', { name: /share plant/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://app.example.com/plants/share/abc123',
      );
    });

    expect(mockAddToast).toHaveBeenCalledWith('Link copied!', 'success');
  });

  it('shows an error toast when the API call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('boom'));

    render(<ShareButton plantId="plant-9" />);
    fireEvent.click(screen.getByRole('button', { name: /share plant/i }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Failed to generate link. Please try again.',
        'error',
      );
    });

    // Button should return to idle state so user can retry.
    const btn = screen.getByRole('button', { name: /share plant/i });
    expect(btn).not.toBeDisabled();
  });

  it('opens the clipboard fallback modal when navigator.clipboard is unavailable', async () => {
    // Simulate environment with no clipboard API.
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    mockCreate.mockResolvedValueOnce({
      share_url: 'https://app.example.com/plants/share/xyz789',
    });

    render(<ShareButton plantId="plant-5" />);
    fireEvent.click(screen.getByRole('button', { name: /share plant/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // The fallback modal should surface the URL for manual copy.
    expect(
      screen.getByDisplayValue('https://app.example.com/plants/share/xyz789'),
    ).toBeInTheDocument();

    // Success toast should NOT have fired — user hasn't copied yet.
    expect(mockAddToast).not.toHaveBeenCalledWith('Link copied!', 'success');
  });
});
