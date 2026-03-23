import { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import './Input.css';

export default function Input({
  label,
  type = 'text',
  error,
  required,
  id,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`;
  const errorId = `${inputId}-error`;
  const isPassword = type === 'password';

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          className={`input-field ${error ? 'input-error' : ''}`}
          aria-required={required || undefined}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span id={errorId} className="input-error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
