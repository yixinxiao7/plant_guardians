import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ShareRevokeModal from '../components/ShareRevokeModal.jsx';
import { ApiError } from '../utils/api.js';

// ── Icon mocks ──────────────────────────────────────────────────────

vi.mock('@phosphor-icons/react', () => ({
  Warning: (props) => <span data-testid="icon-warning" {...props} />,
}));

// ── Toast mock ──────────────────────────────────────────────────────

const mockAddToast = vi.fn();

vi.mock('../hooks/useToast.jsx', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// ── API mock ────────────────────────────────────────────────────────

const mockRevoke = vi.fn();

vi.mock('../utils/api.js', async () => {
  const actual = await vi.importActual('../utils/api.js');
  return {
    ...actual,
    plantShares: {
      revoke: (...args) => mockRevoke(...args),
    },
  };
});

const originalWarn = console.warn;

beforeEach(() => {
  mockAddToast.mockReset();
  mockRevoke.mockReset();
  console.warn = vi.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

// Helper: noop onSuccess / onClose callbacks
function noop() {}

// ── Tests ───────────────────────────────────────────────────────────

describe('ShareRevokeModal (SPEC-023 Surface 2)', () => {
  it('renders with the SPEC-023 heading, body, and Cancel + Remove buttons', () => {
    render(
      <ShareRevokeModal
        isOpen={true}
        plantId="plant-1"
        onSuccess={noop}
        onClose={noop}
      />,
    );

    // Heading — exact copy per SPEC-023
    const heading = screen.getByRole('heading', { name: 'Remove share link?' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('id', 'revoke-modal-title');

    // Body copy
    expect(
      screen.getByText(
        'Anyone with the old link will no longer be able to view this plant.',
      ),
    ).toBeInTheDocument();

    // Two buttons — Cancel + Remove
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /confirm: remove share link/i }),
    ).toBeInTheDocument();

    // Dialog semantics per SPEC-023
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'revoke-modal-title');
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <ShareRevokeModal
        isOpen={false}
        plantId="plant-1"
        onSuccess={noop}
        onClose={noop}
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking Cancel closes the modal without calling DELETE', () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ShareRevokeModal
        isOpen={true}
        plantId="plant-1"
        onSuccess={onSuccess}
        onClose={onClose}
      />,
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it('on DELETE 204 → fires success toast and calls onSuccess', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    mockRevoke.mockResolvedValueOnce(null); // 204 → null

    render(
      <ShareRevokeModal
        isOpen={true}
        plantId="plant-42"
        onSuccess={onSuccess}
        onClose={onClose}
      />,
    );

    const removeBtn = screen.getByRole('button', {
      name: /confirm: remove share link/i,
    });

    await act(async () => {
      fireEvent.click(removeBtn);
    });

    await waitFor(() => {
      expect(mockRevoke).toHaveBeenCalledWith('plant-42');
    });

    expect(mockAddToast).toHaveBeenCalledWith('Share link removed.', 'success');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    // onClose is NOT called on success — parent handles that via onSuccess.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('on DELETE error → fires error toast and keeps the modal open for retry', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    mockRevoke.mockRejectedValueOnce(
      new ApiError('Server error', 'INTERNAL_ERROR', 500),
    );

    render(
      <ShareRevokeModal
        isOpen={true}
        plantId="plant-1"
        onSuccess={onSuccess}
        onClose={onClose}
      />,
    );

    const removeBtn = screen.getByRole('button', {
      name: /confirm: remove share link/i,
    });

    await act(async () => {
      fireEvent.click(removeBtn);
    });

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Failed to remove link. Please try again.',
        'error',
      );
    });

    // Modal stays open — neither onSuccess nor onClose fired.
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // And the "Remove link" button is re-enabled for retry.
    const removeBtnAfter = screen.getByRole('button', {
      name: /confirm: remove share link/i,
    });
    expect(removeBtnAfter).not.toBeDisabled();
  });

  it('Escape key triggers Cancel (closes the modal)', () => {
    const onClose = vi.fn();

    render(
      <ShareRevokeModal
        isOpen={true}
        plantId="plant-1"
        onSuccess={noop}
        onClose={onClose}
      />,
    );

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it('backdrop click is a no-op (destructive confirmation cannot be dismissed by accident)', () => {
    const onClose = vi.fn();

    render(
      <ShareRevokeModal
        isOpen={true}
        plantId="plant-1"
        onSuccess={noop}
        onClose={onClose}
      />,
    );

    const overlay = screen.getByTestId('share-revoke-overlay');
    fireEvent.click(overlay);

    expect(onClose).not.toHaveBeenCalled();
  });
});
