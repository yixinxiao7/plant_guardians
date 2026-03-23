import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plant } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import {
  validateEmail,
  validatePassword,
  validateFullName,
  validateConfirmPassword,
} from '../utils/validation.js';
import './LoginPage.css';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isSignup = activeTab === 'signup';

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear the field error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    setFormError('');
  };

  const validateOnBlur = (field) => {
    let error = null;
    switch (field) {
      case 'fullName':
        error = isSignup ? validateFullName(formData.fullName) : null;
        break;
      case 'email':
        error = validateEmail(formData.email);
        break;
      case 'password':
        error = validatePassword(formData.password);
        break;
      case 'confirmPassword':
        error = isSignup ? validateConfirmPassword(formData.password, formData.confirmPassword) : null;
        break;
    }
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    if (isSignup) {
      newErrors.fullName = validateFullName(formData.fullName);
    }
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    if (isSignup) {
      newErrors.confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword);
    }

    // Filter out null values
    const filtered = Object.fromEntries(Object.entries(newErrors).filter(([, v]) => v));
    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateAll()) return;

    setLoading(true);
    try {
      if (isSignup) {
        const user = await register(formData.fullName, formData.email, formData.password);
        addToast(`Welcome to Plant Guardians, ${user.full_name}!`, 'success');
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/');
    } catch (err) {
      if (err.code === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ email: 'An account with this email already exists.' });
      } else if (err.code === 'INVALID_CREDENTIALS') {
        setFormError('Incorrect email or password.');
      } else if (err.code === 'VALIDATION_ERROR') {
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setFormError('');
  };

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <Plant size={48} weight="fill" color="#fff" />
          <h1 className="login-brand-title">Plant Guardians</h1>
          <p className="login-brand-tagline">Every plant deserves a guardian.</p>
          {/* Decorative leaf SVG */}
          <svg className="login-brand-leaf" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 20C100 20 140 60 140 120C140 160 120 180 100 180C80 180 60 160 60 120C60 60 100 20 100 20Z" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none"/>
            <path d="M100 40V160" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
            <path d="M100 60C110 70 130 80 130 100" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none"/>
            <path d="M100 80C90 90 70 100 70 120" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-container">
          {/* Mobile logo */}
          <div className="login-mobile-logo">
            <Plant size={32} weight="fill" color="#5C7A5C" />
            <span>Plant Guardians</span>
          </div>

          {/* Tab toggle */}
          <div className="login-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={!isSignup}
              className={`login-tab ${!isSignup ? 'active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Log In
            </button>
            <button
              role="tab"
              aria-selected={isSignup}
              className={`login-tab ${isSignup ? 'active' : ''}`}
              onClick={() => switchTab('signup')}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="login-form">
            {formError && (
              <div className="login-form-error" role="alert">
                {formError}
              </div>
            )}

            {isSignup && (
              <Input
                label="Full Name"
                required
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                onBlur={() => validateOnBlur('fullName')}
                error={errors.fullName}
                placeholder="Your full name"
                disabled={loading}
                autoComplete="name"
              />
            )}

            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => validateOnBlur('email')}
              error={errors.email}
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              onBlur={() => validateOnBlur('password')}
              error={errors.password}
              placeholder="Min. 8 characters"
              disabled={loading}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />

            {isSignup && (
              <Input
                label="Confirm Password"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                onBlur={() => validateOnBlur('confirmPassword')}
                error={errors.confirmPassword}
                placeholder="Re-enter password"
                disabled={loading}
                autoComplete="new-password"
              />
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="login-submit"
            >
              {isSignup ? 'Create Account' : 'Log In'}
            </Button>
          </form>

          <p className="login-switch">
            {isSignup ? (
              <>Already have an account? <button type="button" onClick={() => switchTab('login')} className="login-switch-link">Log in</button></>
            ) : (
              <>Don't have an account? <button type="button" onClick={() => switchTab('signup')} className="login-switch-link">Sign up</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
