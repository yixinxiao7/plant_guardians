import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plant, CheckCircle, Warning } from '@phosphor-icons/react';
import { notificationPreferences } from '../utils/api.js';
import './UnsubscribePage.css';

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [errorIs404, setErrorIs404] = useState(false);

  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  useEffect(() => {
    if (!token || !uid) {
      setStatus('error');
      setErrorMessage('This unsubscribe link may have already been used or has expired. If you\'d like to manage your reminder settings, sign in to your profile.');
      return;
    }

    let cancelled = false;

    async function unsubscribe() {
      try {
        await notificationPreferences.unsubscribe(token, uid);
        if (!cancelled) {
          setStatus('success');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          if (err?.status === 404 || err?.code === 'USER_NOT_FOUND') {
            setErrorIs404(true);
            setErrorMessage(
              'This account no longer exists. The unsubscribe link cannot be processed.'
            );
          } else if (err?.code === 'INVALID_TOKEN') {
            setErrorIs404(false);
            setErrorMessage(
              "This unsubscribe link may have already been used or has expired. " +
              "If you'd like to manage your reminder settings, sign in to your profile."
            );
          } else {
            setErrorIs404(false);
            setErrorMessage(
              'Something went wrong. Please try again later or sign in to manage your reminder settings.'
            );
          }
        }
      }
    }

    unsubscribe();

    return () => {
      cancelled = true;
    };
  }, [token, uid]);

  return (
    <div className="unsubscribe-page">
      <div className="unsubscribe-card">
        <div className="unsubscribe-logo">
          <Plant size={28} weight="fill" color="var(--color-accent)" />
          <span className="unsubscribe-logo-text">Plant Guardians</span>
        </div>

        <hr className="unsubscribe-divider" />

        {status === 'loading' && (
          <div className="unsubscribe-loading" aria-busy="true" aria-label="Processing unsubscribe request">
            <div className="unsubscribe-spinner" />
            <p className="unsubscribe-loading-text">Processing your request…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="unsubscribe-success">
            <CheckCircle size={36} color="var(--color-status-green)" weight="regular" aria-hidden="true" />
            <h1 className="unsubscribe-heading">You've been unsubscribed</h1>
            <p className="unsubscribe-body">
              You won't receive any more care reminder emails from Plant Guardians.
            </p>
            <p className="unsubscribe-body">
              Changed your mind? You can re-enable reminders anytime from your Profile page.
            </p>
            <a href="/" className="unsubscribe-cta">Go to Plant Guardians</a>
          </div>
        )}

        {status === 'error' && (
          <div className="unsubscribe-error">
            <Warning size={36} color="var(--color-status-red)" weight="regular" aria-hidden="true" />
            <h1 className="unsubscribe-heading">Link not valid</h1>
            <p className="unsubscribe-body">{errorMessage}</p>
            {errorIs404 ? (
              <a href="/" className="unsubscribe-cta">Go to Plant Guardians</a>
            ) : (
              <a href="/login" className="unsubscribe-cta">Sign In</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
