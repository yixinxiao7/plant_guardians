import { WarningCircle } from '@phosphor-icons/react';
import Button from './Button.jsx';
import './CareHistorySection.css';

/**
 * Error state for Care History section (SPEC-015).
 * Non-fatal — renders inline without breaking the page.
 */
export default function CareHistoryError({ message, onRetry }) {
  return (
    <div className="ch-error">
      <WarningCircle size={32} className="ch-error-icon" />
      <h3 className="ch-error-heading">Couldn't load care history.</h3>
      <p className="ch-error-body">Check your connection and try again.</p>
      <Button variant="secondary" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}
