import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ShareStatusArea from '../components/ShareStatusArea.jsx';
import { ApiError } from '../utils/api.js';

// ── Icon mocks ──────────────────────────────────────────────────────

vi.mock('@phosphor-icons/react', () => ({
  ShareNetwork: (props) => <span data-testid="icon-share" {...props} />,
  Warning: (props) => <span data-testid="icon-warning" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

// ── Toast mock ──────────────────────────────────────────────────────

const mockAddToast = vi.fn();

vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// ── API mock ────────────────────────────────────────────────────────

const mockGetStatus = vi.fn();
const mockRevoke = vi.fn();
const mockCreate = vi.fn();

vi.mock('../utils/api.js', async () => {
  const actual = await vi.importActual('../utils/api.js');
  return {
    ...actual,
    plantShares: {
      getStatus: (...args) => mockGetStatus(...args),
      revoke: (...args) => mockRevoke(...args),
      create: (...args) => mockCreate(...args),
    },
  };
});

// Suppress the "GET /share failed:" warn from safe degradation path.
const originalWarn = console.warn;

beforeEach(() => {
  mockAddToast.mockReset();
  mockGetStatus.mockReset();
  mockRevoke.mockReset();
  mockCreate.mockReset();
  console.warn = vi.fn();

  // Clipboard write success by default.
  const clipboardWriteText = vi.fn().mockResolvedValue();
  Object.defineProperty(global.navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: clipboardWriteText },
  });
});

afterEach(() => {
  console.warn = originalWarn;
});

// ── Tests ───────────────────────────────────────────────────────────

describe('ShareStatusArea (SPEC-023 Surface 1)', () => {
  it('renders the shimmer skeleton while GET /share is in flight', async () => {
    let resolveFetch;
    mockGetStatus.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const { container } = render(<ShareStatusArea plantId="plant-1" />);

    // Skeleton region has aria-busy and aria-label per SPEC-023
    const loadingRegion = container.querySelector('.ssa-root--loading');
    expect(loadingRegion).not.toBeNull();
    expect(loadingRegion).toHaveAttribute('aria-busy', 'true');
    expect(loadingRegion).toHaveAttribute('aria-label', 'Loading share status');
    expect(container.querySelector('.ssa-skeleton')).not.toBeNull();

    // Neither Copy link nor original Share button are present yet.
    expect(screen.queryByRole('button', { name: /copy plant share link/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /share plant/i })).toBeNull();

    await act(async () => {
      resolveFetch({ share_url: 'https://example.com/plants/share/tok' });
    });
  });

  it('renders "Copy link" + "Remove share link" when GET /share returns 200', async () => {
    mockGetStatus.mockResolvedValueOnce({
      share_url: 'https://example.com/plants/share/tok123',
    });

    render(<ShareStatusArea plantId="plant-1" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /copy plant share link/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /remove share link for this plant/i }),
    ).toBeInTheDocument();

    // Original Share button (Sprint 28) should NOT be present in SHARED state
    expect(screen.queryByRole('button', { name: /^share plant/i })).toBeNull();
  });

  it('renders the original Share button when GET /share returns 404', async () => {
    mockGetStatus.mockRejectedValueOnce(
      new ApiError('No share', 'NOT_FOUND', 404),
    );

    render(<ShareStatusArea plantId="plant-1" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /share plant/i }),
      ).toBeInTheDocument();
    });

    // Copy link / Remove share link should NOT be present in NOT_SHARED state
    expect(
      screen.queryByRole('button', { name: /copy plant share link/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /remove share link for this plant/i }),
    ).toBeNull();
  });

  it('degrades safely to the Share button when GET /share returns a non-404 error (no error toast)', async () => {
    mockGetStatus.mockRejectedValueOnce(
      new ApiError('Server error', 'INTERNAL_ERROR', 500),
    );

    render(<ShareStatusArea plantId="plant-1" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /share plant/i }),
      ).toBeInTheDocument();
    });

    // SPEC-023: no error toast on the safe-degradation path.
    expect(mockAddToast).not.toHaveBeenCalled();
  });

  it('"Copy link" writes the stored share_url to clipboard with no new API call', async () => {
    const shareUrl = 'https://example.com/plants/share/tok-cpy';
    mockGetStatus.mockResolvedValueOnce({ share_url: shareUrl });

    render(<ShareStatusArea plantId="plant-1" />);

    const copyBtn = await screen.findByRole('button', {
      name: /copy plant share link/i,
    });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // Clipboard write called with the stored share_url
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareUrl);
    // Success toast fired
    expect(mockAddToast).toHaveBeenCalledWith('Link copied!', 'success');
    // POST /share must NOT be called — the share_url is already in memory
    expect(mockCreate).not.toHaveBeenCalled();
    // And we don't fire GET /share again either
    expect(mockGetStatus).toHaveBeenCalledTimes(1);
  });

  it('clicking "Remove share link" opens the ShareRevokeModal', async () => {
    mockGetStatus.mockResolvedValueOnce({
      share_url: 'https://example.com/plants/share/tok',
    });

    render(<ShareStatusArea plantId="plant-1" />);

    const revokeLink = await screen.findByRole('button', {
      name: /remove share link for this plant/i,
    });

    fireEvent.click(revokeLink);

    // Modal with heading id=revoke-modal-title appears
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /remove share link\?/i }),
      ).toBeInTheDocument();
    });

    // Remove + Cancel buttons are present
    expect(
      screen.getByRole('button', { name: /confirm: remove share link/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('after successful revocation, transitions back to the NOT_SHARED state', async () => {
    mockGetStatus.mockResolvedValueOnce({
      share_url: 'https://example.com/plants/share/tok-x',
    });
    mockRevoke.mockResolvedValueOnce(null); // 204 → null

    render(<ShareStatusArea plantId="plant-1" />);

    // Open revoke modal
    const revokeLink = await screen.findByRole('button', {
      name: /remove share link for this plant/i,
    });
    fireEvent.click(revokeLink);

    // Confirm removal
    const confirmBtn = await screen.findByRole('button', {
      name: /confirm: remove share link/i,
    });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Share link removed.', 'success');
    });

    // After success, area shows the original Share button.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /share plant/i }),
      ).toBeInTheDocument();
    });

    // And Copy / Remove are gone.
    expect(
      screen.queryByRole('button', { name: /copy plant share link/i }),
    ).toBeNull();
  });

  it('degrades to the Share button when GET /share returns 403 (wrong owner, safe degradation)', async () => {
    mockGetStatus.mockRejectedValueOnce(
      new ApiError('Forbidden', 'FORBIDDEN', 403),
    );

    render(<ShareStatusArea plantId="plant-1" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /share plant/i }),
      ).toBeInTheDocument();
    });

    // No error toast on the 403 safe-degradation path.
    expect(mockAddToast).not.toHaveBeenCalled();
  });
});
