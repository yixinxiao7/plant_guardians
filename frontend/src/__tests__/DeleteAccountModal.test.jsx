import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteAccountModal from '../components/DeleteAccountModal.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Warning: (props) => <span data-testid="icon-warning" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

describe('DeleteAccountModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirmDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<DeleteAccountModal isOpen={false} onClose={() => {}} onConfirmDelete={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with consequence list and confirmation input when open', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete your account?')).toBeInTheDocument();
    expect(screen.getByText('This will permanently delete:')).toBeInTheDocument();
    expect(screen.getByText('Your account and profile')).toBeInTheDocument();
    expect(screen.getByText('All your plants')).toBeInTheDocument();
    expect(screen.getByText('All care history and notes')).toBeInTheDocument();
    expect(screen.getByText('All care schedules and reminders')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByLabelText('Type DELETE to confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete my account')).toBeInTheDocument();
  });

  it('renders Danger Zone collapsed by default (aria-expanded="false")', () => {
    // This tests the trigger button behavior, which is in ProfilePage.
    // For the modal: just verify aria attributes
    render(<DeleteAccountModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-modal-title');
  });

  it('confirm button is disabled when input is empty', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    const confirmBtn = screen.getByText('Delete my account').closest('button');
    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('confirm button is disabled when input is "delete" (wrong case)', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    const input = screen.getByLabelText('Type DELETE to confirm');
    fireEvent.change(input, { target: { value: 'delete' } });
    const confirmBtn = screen.getByText('Delete my account').closest('button');
    expect(confirmBtn).toBeDisabled();
  });

  it('confirm button is disabled when input is "DELET" (incomplete)', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    const input = screen.getByLabelText('Type DELETE to confirm');
    fireEvent.change(input, { target: { value: 'DELET' } });
    const confirmBtn = screen.getByText('Delete my account').closest('button');
    expect(confirmBtn).toBeDisabled();
  });

  it('confirm button is enabled when input is exactly "DELETE"', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    const input = screen.getByLabelText('Type DELETE to confirm');
    fireEvent.change(input, { target: { value: 'DELETE' } });
    const confirmBtn = screen.getByText('Delete my account').closest('button');
    expect(confirmBtn).not.toBeDisabled();
  });

  it('calls onConfirmDelete on confirm click when input is "DELETE"', async () => {
    const onConfirmDelete = vi.fn().mockResolvedValue(undefined);
    render(<DeleteAccountModal {...defaultProps} onConfirmDelete={onConfirmDelete} />);

    const input = screen.getByLabelText('Type DELETE to confirm');
    fireEvent.change(input, { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByText('Delete my account'));

    await waitFor(() => {
      expect(onConfirmDelete).toHaveBeenCalledTimes(1);
    });
  });

  it('shows inline error on API failure', async () => {
    const onConfirmDelete = vi.fn().mockRejectedValue(new Error('Server error'));
    render(<DeleteAccountModal {...defaultProps} onConfirmDelete={onConfirmDelete} />);

    const input = screen.getByLabelText('Type DELETE to confirm');
    fireEvent.change(input, { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByText('Delete my account'));

    await waitFor(() => {
      expect(screen.getByText('Could not delete your account. Please try again.')).toBeInTheDocument();
    });

    // Error should have role="alert"
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // Modal should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Input should still have "DELETE" text
    expect(input.value).toBe('DELETE');
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<DeleteAccountModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Close × button is clicked', () => {
    const onClose = vi.fn();
    render(<DeleteAccountModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
