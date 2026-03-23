import { render, screen } from '@testing-library/react';
import ToastContainer from '../components/ToastContainer.jsx';

vi.mock('../hooks/useToast.js', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: vi.fn(),
  }),
}));

describe('ToastContainer', () => {
  it('renders without crashing', () => {
    const { container } = render(<ToastContainer />);
    expect(container).toBeDefined();
  });

  it('renders nothing when no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });
});
