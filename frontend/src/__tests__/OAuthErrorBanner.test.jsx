import { render, screen } from '@testing-library/react';
import OAuthErrorBanner from '../components/OAuthErrorBanner.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Warning: (props) => <span data-testid="icon-warning" {...props} />,
}));

describe('OAuthErrorBanner', () => {
  it('renders nothing when errorCode is null', () => {
    const { container } = render(<OAuthErrorBanner errorCode={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows access_denied message', () => {
    render(<OAuthErrorBanner errorCode="access_denied" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/You cancelled/)).toBeInTheDocument();
  });

  it('shows oauth_failed message', () => {
    render(<OAuthErrorBanner errorCode="oauth_failed" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('shows generic message for unknown error codes', () => {
    render(<OAuthErrorBanner errorCode="unknown_error" />);
    expect(screen.getByText(/Sign-in with Google was unsuccessful/)).toBeInTheDocument();
  });
});
