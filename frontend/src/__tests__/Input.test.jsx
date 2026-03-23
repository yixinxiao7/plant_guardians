import { render, screen } from '@testing-library/react';
import Input from '../components/Input.jsx';

vi.mock('@phosphor-icons/react', () => ({
  Eye: (props) => <span data-testid="icon-eye" {...props} />,
  EyeSlash: (props) => <span data-testid="icon-eye-slash" {...props} />,
}));

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows password toggle for password type', () => {
    render(<Input label="Password" type="password" />);
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });
});
