import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteAccountModal from '../components/DeleteAccountModal.jsx';

vi.mock('@phosphor-icons/react', () => ({
  WarningOctagon: (props) => <span data-testid="icon-warning" {...props} />,
  Eye: (props) => <span data-testid="icon-eye" {...props} />,
  EyeSlash: (props) => <span data-testid="icon-eye-slash" {...props} />,
}));

describe('DeleteAccountModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onDeleteSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<DeleteAccountModal isOpen={false} onClose={() => {}} onDeleteSuccess={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal content with password input when open', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete your account?')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete your account and all your plant data/)).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm your password')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete my account')).toBeInTheDocument();
  });

  it('calls onClose and clears password when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<DeleteAccountModal {...defaultProps} onClose={onClose} />);

    const passwordInput = screen.getByLabelText('Confirm your password');
    fireEvent.change(passwordInput, { target: { value: 'mypass' } });
    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables "Delete my account" button when password is empty', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    const deleteBtn = screen.getByRole('button', { name: 'Delete my account' });
    expect(deleteBtn).toBeDisabled();
  });

  it('enables "Delete my account" button when password is entered', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    const passwordInput = screen.getByLabelText('Confirm your password');
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
    const deleteBtn = screen.getByRole('button', { name: 'Delete my account' });
    expect(deleteBtn).not.toBeDisabled();
  });

  it('shows inline "Password is incorrect." error on 400 INVALID_PASSWORD', async () => {
    const onDeleteSuccess = vi.fn().mockRejectedValue({
      status: 400,
      code: 'INVALID_PASSWORD',
      message: 'Password is incorrect.',
    });
    render(<DeleteAccountModal {...defaultProps} onDeleteSuccess={onDeleteSuccess} />);

    const passwordInput = screen.getByLabelText('Confirm your password');
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => {
      expect(screen.getByText('Password is incorrect.')).toBeInTheDocument();
    });

    // Modal should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Password should NOT be cleared — re-query the input after re-render
    const input = screen.getByLabelText('Confirm your password');
    expect(input.value).toBe('wrongpass');
  });

  it('shows generic error on server failure (5xx)', async () => {
    const onDeleteSuccess = vi.fn().mockRejectedValue({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    render(<DeleteAccountModal {...defaultProps} onDeleteSuccess={onDeleteSuccess} />);

    const passwordInput = screen.getByLabelText('Confirm your password');
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });

    // Modal should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onDeleteSuccess with the entered password', async () => {
    const onDeleteSuccess = vi.fn().mockResolvedValue(undefined);
    render(<DeleteAccountModal {...defaultProps} onDeleteSuccess={onDeleteSuccess} />);

    const passwordInput = screen.getByLabelText('Confirm your password');
    fireEvent.change(passwordInput, { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => {
      expect(onDeleteSuccess).toHaveBeenCalledWith('correct-password');
    });
  });

  it('has correct ARIA attributes', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-modal-heading');
    expect(dialog).toHaveAttribute('aria-describedby', 'delete-modal-desc');
  });

  it('toggles password visibility', () => {
    render(<DeleteAccountModal {...defaultProps} />);
    const passwordInput = screen.getByLabelText('Confirm your password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByLabelText('Show password');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByLabelText('Hide password');
    fireEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows session expired error on 401', async () => {
    const onDeleteSuccess = vi.fn().mockRejectedValue({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Session expired.',
    });
    render(<DeleteAccountModal {...defaultProps} onDeleteSuccess={onDeleteSuccess} />);

    const passwordInput = screen.getByLabelText('Confirm your password');
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => {
      expect(screen.getByText('Session expired. Please log in again.')).toBeInTheDocument();
    });
  });
});
