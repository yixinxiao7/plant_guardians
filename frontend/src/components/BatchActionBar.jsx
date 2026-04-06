import { WarningCircle } from '@phosphor-icons/react';
import Button from './Button.jsx';
import './BatchActionBar.css';

/**
 * Sticky bottom action bar for batch mark-done on Care Due Dashboard.
 *
 * Props:
 *   selectedCount  - number of selected items
 *   onMarkDone     - called when user clicks "Mark done"
 *   onConfirm      - called when user clicks "Confirm"
 *   onCancel       - called when user clicks cancel inside the action bar (not header cancel)
 *   onRetry        - called when user clicks "Retry" on partial failure
 *   state          - 'idle' | 'confirm' | 'loading' | 'partial-failure'
 *   successCount   - number of items that succeeded (for partial failure message)
 *   failCount      - number of items that failed (for partial failure message)
 *   totalAttempted - total items attempted (for partial failure message)
 */
export default function BatchActionBar({
  selectedCount,
  onMarkDone,
  onConfirm,
  onCancel,
  onRetry,
  state = 'idle',
  successCount = 0,
  failCount = 0,
  totalAttempted = 0,
}) {
  const visible = selectedCount > 0 || state === 'partial-failure' || state === 'loading';

  return (
    <div
      className={`batch-action-bar ${visible ? 'batch-action-bar--visible' : ''}`}
      role="toolbar"
      aria-label="Batch actions toolbar"
      aria-busy={state === 'loading' ? 'true' : undefined}
    >
      {state === 'idle' && (
        <div className="batch-action-bar__content batch-action-bar__content--fade">
          <span aria-live="polite" aria-atomic="true" className="batch-action-bar__count">
            {selectedCount} selected
          </span>
          <Button
            variant="primary"
            onClick={onMarkDone}
            disabled={selectedCount === 0}
            aria-disabled={selectedCount === 0 ? 'true' : 'false'}
            aria-label={`Mark ${selectedCount} selected items as done`}
          >
            Mark done
          </Button>
        </div>
      )}

      {state === 'confirm' && (
        <div className="batch-action-bar__content batch-action-bar__content--fade">
          <span className="batch-action-bar__message">
            Mark {selectedCount} {selectedCount === 1 ? 'item' : 'items'} as done?
          </span>
          <div className="batch-action-bar__buttons">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              aria-label={`Confirm marking ${selectedCount} items as done`}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}

      {state === 'loading' && (
        <div className="batch-action-bar__content batch-action-bar__content--fade">
          <span className="batch-action-bar__spinner" aria-hidden="true" />
          <span className="batch-action-bar__loading-text" aria-live="polite">
            Marking done...
          </span>
        </div>
      )}

      {state === 'partial-failure' && (
        <div className="batch-action-bar__content batch-action-bar__content--fade">
          <div className="batch-action-bar__error">
            <WarningCircle size={16} color="var(--color-warning, #C4921F)" aria-hidden="true" />
            <span aria-live="assertive" className="batch-action-bar__error-text">
              {successCount} of {totalAttempted} marked done. {failCount} failed — tap to retry failed items.
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={onRetry}
            aria-label={`Retry ${failCount} failed items`}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
