import { useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import './ClipboardFallbackModal.css';

/**
 * ClipboardFallbackModal — Sprint 28 / SPEC-022
 *
 * Manual-copy modal shown when `navigator.clipboard.writeText` is not
 * available or throws (e.g., non-HTTPS context, older browsers, or
 * permission denied). Renders the share URL in a read-only input with
 * the text pre-selected so the user can quickly copy with Cmd/Ctrl-C.
 *
 * Props:
 *   - shareUrl: string (required)
 *   - onClose: () => void (required)
 */
export default function ClipboardFallbackModal({ shareUrl, onClose }) {
  const inputRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Focus + select the URL on mount so Cmd/Ctrl-C works immediately.
  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    // Delay slightly so Modal's own focus logic completes first.
    const timer = setTimeout(() => {
      try {
        node.focus();
        node.select();
      } catch {}
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyClick = () => {
    const node = inputRef.current;
    if (!node) return;
    try {
      node.focus();
      node.select();
      // Legacy fallback — execCommand is deprecated but still widely supported
      // in non-HTTPS contexts where navigator.clipboard is unavailable.
      const ok = document.execCommand && document.execCommand('copy');
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // No further fallback — user can still copy manually.
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Share this plant" width={440}>
      <div className="clipboard-fallback-body">
        <p className="clipboard-fallback-description">
          Copy the link below to share this plant's care profile.
        </p>
        <input
          ref={inputRef}
          type="url"
          readOnly
          value={shareUrl}
          className="clipboard-fallback-input"
          aria-label="Share link"
          onFocus={(e) => e.target.select()}
        />
        <div className="clipboard-fallback-actions">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handleCopyClick}>
            {copied ? 'Copied ✓' : 'Copy'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
