import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Leaf, Drop, PottedPlant, Sun, CloudRain, Sparkle, Camera, PencilSimple, ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { useAIAdvice } from '../hooks/useAIAdvice.js';
import Button from './Button.jsx';
import './AIAdvicePanel.css';

const MAX_PLANT_TYPE_LENGTH = 200;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatInterval(days) {
  if (days == null) return null;
  if (days === 1) return 'Every day';
  return `Every ${days} days`;
}

function ConfidenceBadge({ confidence }) {
  const map = {
    high: { className: 'confidence-high', label: 'High confidence' },
    medium: { className: 'confidence-medium', label: 'Medium confidence' },
    low: { className: 'confidence-low', label: 'Low confidence' },
  };
  const info = map[confidence] || map.medium;
  return (
    <span className={`confidence-badge ${info.className}`} aria-label={info.label}>
      {info.label}
    </span>
  );
}

function CareRow({ icon, label, value, nullText = 'Not typically needed' }) {
  return (
    <div className="care-row">
      <span className="care-row-icon">{icon}</span>
      <span className="care-row-label">{label}</span>
      <span className={`care-row-value ${value == null ? 'care-row-null' : ''}`}>
        {value != null ? value : nullText}
      </span>
    </div>
  );
}

function SkeletonLoading() {
  return (
    <div className="advice-skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading plant advice…</span>
      <div className="skeleton-row skeleton-row-wide" />
      <div className="skeleton-row skeleton-row-medium" />
      <div className="skeleton-row skeleton-row-narrow" />
    </div>
  );
}

export default function AIAdvicePanel({ isOpen, onClose, onAccept, initialPlantType = '' }) {
  const panelRef = useRef(null);
  const textInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const triggerRef = useRef(null);
  const previousFocusRef = useRef(null);

  const [activeTab, setActiveTab] = useState('text'); // text | image
  const [plantType, setPlantType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const { status, advice, error, getTextAdvice, getImageAdvice, reset } = useAIAdvice();

  // Store ref to the trigger button for focus restore
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab('text');
      setPlantType(initialPlantType || '');
      setSelectedFile(null);
      setFilePreviewUrl('');
      setFileError('');
      setIsAnimatingOut(false);
      reset();

      // Focus text input after animation
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);

      // Lock body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialPlantType, reset]);

  // Focus trap and keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
      // Restore focus
      previousFocusRef.current?.focus();
    }, 250);
  }, [onClose]);

  const handleTabSwitch = useCallback((tab) => {
    if (status === 'loading') return;
    setActiveTab(tab);
    // Reset inputs and results when switching tabs
    setPlantType('');
    setSelectedFile(null);
    setFilePreviewUrl('');
    setFileError('');
    reset();

    if (tab === 'text') {
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  }, [status, reset]);

  // Text submit
  const handleTextSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!plantType.trim()) return;
    try {
      await getTextAdvice(plantType);
    } catch {
      // Error state handled by hook
    }
  }, [plantType, getTextAdvice]);

  // File selection + validation
  const handleFileSelect = useCallback((file) => {
    setFileError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Please upload a JPEG, PNG, or WebP image.');
      setSelectedFile(null);
      setFilePreviewUrl('');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Image must be 5MB or smaller.');
      setSelectedFile(null);
      setFilePreviewUrl('');
      return;
    }

    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreviewUrl('');
    setFileError('');
  }, []);

  // Drag and drop
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // Image submit
  const handleImageSubmit = useCallback(async () => {
    if (!selectedFile || fileError) return;
    try {
      await getImageAdvice(selectedFile);
    } catch {
      // Error state handled by hook
    }
  }, [selectedFile, fileError, getImageAdvice]);

  // Accept advice
  const handleAccept = useCallback(() => {
    if (advice && onAccept) {
      onAccept(advice);
    }
    handleClose();
  }, [advice, onAccept, handleClose]);

  // Try different plant / search again
  const handleSearchAgain = useCallback(() => {
    reset();
    if (activeTab === 'text') {
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  }, [reset, activeTab]);

  // Switch to text mode (from image error)
  const handleSwitchToText = useCallback(() => {
    handleTabSwitch('text');
  }, [handleTabSwitch]);

  // Retry (re-submit last request)
  const handleRetry = useCallback(async () => {
    if (activeTab === 'text' && plantType.trim()) {
      try { await getTextAdvice(plantType); } catch {}
    } else if (activeTab === 'image' && selectedFile) {
      try { await getImageAdvice(selectedFile); } catch {}
    }
  }, [activeTab, plantType, selectedFile, getTextAdvice, getImageAdvice]);

  if (!isOpen && !isAnimatingOut) return null;

  const isLoading = status === 'loading';
  const hasResults = status === 'success' && advice;
  const hasError = status === 'error';
  const is502 = hasError && error?.status === 502;
  const showCharCounter = plantType.length >= 150;
  const textDisabled = !plantType.trim() || plantType.length > MAX_PLANT_TYPE_LENGTH;
  const imageDisabled = !selectedFile || !!fileError;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`advice-panel-backdrop ${isAnimatingOut ? 'advice-panel-backdrop-out' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`advice-panel ${isAnimatingOut ? 'advice-panel-out' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="AI Plant Advisor"
      >
        {/* Mobile drag handle */}
        <div className="advice-panel-drag-handle" aria-hidden="true">
          <div className="drag-handle-pill" />
        </div>

        {/* Header */}
        <div className="advice-panel-header">
          <div>
            <h2 className="advice-panel-title">AI Plant Advisor</h2>
            <p className="advice-panel-subtitle">Identify your plant and get personalized care tips.</p>
          </div>
          <button
            className="advice-panel-close"
            onClick={handleClose}
            aria-label="Close AI advice panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="advice-panel-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'text'}
            aria-controls="tab-panel-text"
            className={`advice-tab ${activeTab === 'text' ? 'advice-tab-active' : ''}`}
            onClick={() => handleTabSwitch('text')}
            disabled={isLoading}
          >
            <PencilSimple size={16} /> Enter plant name
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'image'}
            aria-controls="tab-panel-image"
            className={`advice-tab ${activeTab === 'image' ? 'advice-tab-active' : ''}`}
            onClick={() => handleTabSwitch('image')}
            disabled={isLoading}
          >
            <Camera size={16} /> Upload a photo
          </button>
        </div>

        {/* Scrollable content */}
        <div className="advice-panel-content">
          {/* Text Mode Input */}
          {activeTab === 'text' && !hasResults && !hasError && (
            <div id="tab-panel-text" role="tabpanel" aria-labelledby="tab-text">
              <form onSubmit={handleTextSubmit}>
                <label className="advice-input-label" htmlFor="ai-plant-type-input">
                  What type of plant is this?
                </label>
                <input
                  ref={textInputRef}
                  id="ai-plant-type-input"
                  type="text"
                  className="advice-text-input"
                  placeholder="e.g., spider plant, peace lily, monstera"
                  value={plantType}
                  onChange={(e) => setPlantType(e.target.value)}
                  maxLength={MAX_PLANT_TYPE_LENGTH}
                  disabled={isLoading}
                  aria-label="Plant type name"
                />
                {showCharCounter && (
                  <span className="advice-char-counter">
                    {plantType.length} / {MAX_PLANT_TYPE_LENGTH}
                  </span>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={textDisabled || isLoading}
                  loading={isLoading}
                  className="advice-submit-btn"
                >
                  Get Advice
                </Button>
              </form>
            </div>
          )}

          {/* Image Mode Input */}
          {activeTab === 'image' && !hasResults && !hasError && (
            <div id="tab-panel-image" role="tabpanel" aria-labelledby="tab-image">
              {!selectedFile ? (
                <div
                  className={`advice-upload-zone ${isDragOver ? 'advice-upload-zone-active' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Camera size={40} className="advice-upload-icon" />
                  <p className="advice-upload-text">Drop a photo here</p>
                  <p className="advice-upload-or">or</p>
                  <Button
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    Browse files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={handleFileInputChange}
                    className="sr-only"
                    aria-label="Upload a plant photo"
                  />
                </div>
              ) : (
                <div className="advice-file-preview">
                  <img
                    src={filePreviewUrl}
                    alt="Selected plant"
                    className="advice-file-thumb"
                  />
                  <div className="advice-file-info">
                    <span className="advice-file-name">{selectedFile.name}</span>
                    <span className="advice-file-size">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <button
                    className="advice-file-remove"
                    onClick={handleRemoveFile}
                    aria-label="Remove selected file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {fileError && (
                <p className="advice-file-error" aria-live="polite" role="alert">
                  {fileError}
                </p>
              )}

              <Button
                variant="primary"
                fullWidth
                disabled={imageDisabled || isLoading}
                loading={isLoading}
                onClick={handleImageSubmit}
                className="advice-submit-btn"
              >
                Identify & Get Advice
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && <SkeletonLoading />}

          {/* Success Results */}
          {hasResults && (
            <div className="advice-results" aria-live="polite">
              {/* Search again link */}
              <button className="advice-search-again" onClick={handleSearchAgain}>
                <ArrowLeft size={14} /> Try a different plant
              </button>

              {/* Plant Identification Banner */}
              {advice.identified_plant && (
                <div
                  className="advice-plant-banner"
                  aria-label={`Identified as ${advice.identified_plant}, ${advice.confidence} confidence`}
                >
                  <div className="advice-plant-banner-left">
                    <Leaf size={24} color="#4A7C59" />
                    <div>
                      <span className="advice-plant-label">IDENTIFIED AS</span>
                      <span className="advice-plant-name">{advice.identified_plant}</span>
                    </div>
                  </div>
                  <ConfidenceBadge confidence={advice.confidence} />
                </div>
              )}

              {advice.confidence === 'low' && (
                <p className="advice-disclaimer">
                  Results may be approximate. Verify with a plant expert.
                </p>
              )}

              {/* Care Schedule */}
              <h3 className="advice-section-heading">Recommended Care Schedule</h3>
              <div className="advice-care-rows">
                <CareRow
                  icon="💧"
                  label="Watering"
                  value={formatInterval(advice.care?.watering_interval_days)}
                />
                <CareRow
                  icon="🌱"
                  label="Fertilizing"
                  value={formatInterval(advice.care?.fertilizing_interval_days)}
                />
                <CareRow
                  icon="🪴"
                  label="Repotting"
                  value={formatInterval(advice.care?.repotting_interval_days)}
                />
              </div>

              {/* Growing Conditions */}
              <h3 className="advice-section-heading">Growing Conditions</h3>
              <div className="advice-care-rows">
                <CareRow
                  icon="☀️"
                  label="Light"
                  value={advice.care?.light_requirement}
                  nullText="Not specified"
                />
                <CareRow
                  icon="💦"
                  label="Humidity"
                  value={advice.care?.humidity_preference}
                  nullText="Not specified"
                />
              </div>

              {/* Care Tips */}
              {advice.care?.care_tips && (
                <>
                  <h3 className="advice-section-heading">Care Tips</h3>
                  <div className="advice-tips-block">
                    {advice.care.care_tips}
                  </div>
                </>
              )}

              {/* CTA Footer */}
              <div className="advice-cta-divider" />
              <div className="advice-cta-footer">
                <Button variant="primary" fullWidth onClick={handleAccept}>
                  ✓ Accept Advice
                </Button>
                <Button variant="ghost" fullWidth onClick={handleClose} className="advice-dismiss-btn">
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="advice-error-container" aria-live="assertive" role="alert">
              <WarningCircle size={20} className="advice-error-icon" />
              <p className="advice-error-text">
                {is502
                  ? 'AI advice is temporarily unavailable. Please try again.'
                  : (error?.message || 'Something went wrong. Please try again.')}
              </p>
              <Button variant="secondary" onClick={handleRetry} className="advice-retry-btn">
                Try Again
              </Button>
              {activeTab === 'image' && is502 && (
                <Button variant="ghost" onClick={handleSwitchToText} className="advice-switch-btn">
                  Switch to text mode
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
