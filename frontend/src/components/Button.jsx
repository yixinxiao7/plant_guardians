import { forwardRef } from 'react';
import './Button.css';

const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={`btn btn-${variant} ${size === 'small' ? 'btn-small' : ''} ${fullWidth ? 'btn-full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" aria-label="Loading" />
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
