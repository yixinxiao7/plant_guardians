import { render, screen, fireEvent } from '@testing-library/react';
import GoogleOAuthButton from '../components/GoogleOAuthButton.jsx';

describe('GoogleOAuthButton', () => {
  it('renders with "Sign in with Google" label', () => {
    render(<GoogleOAuthButton onClick={() => {}} />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<GoogleOAuthButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows spinner and sets aria-busy when loading', () => {
    render(<GoogleOAuthButton onClick={() => {}} loading />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-label', 'Signing in with Google\u2026');
    expect(screen.queryByText('Sign in with Google')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<GoogleOAuthButton onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading prop is true', () => {
    render(<GoogleOAuthButton onClick={() => {}} loading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
