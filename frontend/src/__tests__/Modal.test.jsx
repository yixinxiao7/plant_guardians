import { render, screen } from '@testing-library/react';
import Modal from '../components/Modal.jsx';

vi.mock('@phosphor-icons/react', () => ({
  X: (props) => <span data-testid="icon-x" {...props} />,
}));

describe('Modal', () => {
  it('renders without crashing when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Title">
        <p>Body</p>
      </Modal>
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });
});
