import { Warning } from '@phosphor-icons/react';
import './OAuthErrorBanner.css';

const ERROR_MESSAGES = {
  access_denied: 'You cancelled the Google sign-in. Try again or use email and password below.',
  oauth_failed: 'Something went wrong with Google sign-in. Please try again or use email and password below.',
};

const DEFAULT_MESSAGE = 'Sign-in with Google was unsuccessful. Please try again or use email and password below.';

/**
 * Displays an error banner when the OAuth callback redirects
 * back with an ?error= query parameter.
 *
 * Props:
 *   errorCode: string — the value of the ?error= query param
 */
export default function OAuthErrorBanner({ errorCode }) {
  if (!errorCode) return null;

  const message = ERROR_MESSAGES[errorCode] || DEFAULT_MESSAGE;

  return (
    <div className="oauth-error-banner" role="alert">
      <Warning
        size={16}
        color="#B85C38"
        aria-hidden="true"
        style={{ flexShrink: 0, marginTop: 1 }}
      />
      <span className="oauth-error-banner-text">{message}</span>
    </div>
  );
}
