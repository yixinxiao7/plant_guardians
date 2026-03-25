import { render, screen, fireEvent } from '@testing-library/react';
import DeleteAccountModal from '../components/DeleteAccountModal.jsx';

vi.mock('@phosphor-icons/react', () => ({
  WarningOctagon: (props) => <span data-testid="icon-warning" {...props} />,
}));

describe('DeleteAccountModal', () => {
  it('does not render when isOpen is false', () => {
    render(<DeleteAccountModal isOpen={false} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal content when open', () => {
    render(<DeleteAccountModal isOpen={true} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete your account?')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete your account/)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete my account')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<DeleteAccountModal isOpen={true} onCancel={onCancel} onConfirm={() => {}} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('has correct ARIA attributes', () => {
    render(<DeleteAccountModal isOpen={true} onCancel={() => {}} onConfirm={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-modal-heading');
    expect(dialog).toHaveAttribute('aria-describedby', 'delete-modal-body');
  });

  it('renders the warning icon', () => {
    render(<DeleteAccountModal isOpen={true} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByTestId('icon-warning')).toBeInTheDocument();
  });
});
