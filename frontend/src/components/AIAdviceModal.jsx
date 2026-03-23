import { useState, useEffect } from 'react';
import { Sparkle, Drop, Leaf, PottedPlant, Sun, CloudRain, Lightbulb } from '@phosphor-icons/react';
import { ai } from '../utils/api.js';
import Modal from './Modal.jsx';
import PhotoUpload from './PhotoUpload.jsx';
import Button from './Button.jsx';
import './AIAdviceModal.css';

export default function AIAdviceModal({
  isOpen,
  onClose,
  plantType: initialPlantType,
  photoUrl: initialPhotoUrl,
  onAccept,
}) {
  const [state, setState] = useState('input'); // input, loading, results, error
  const [localPlantType, setLocalPlantType] = useState('');
  const [localPhoto, setLocalPhoto] = useState(null);
  const [localPhotoUrl, setLocalPhotoUrl] = useState('');
  const [advice, setAdvice] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setState('input');
      setLocalPlantType(initialPlantType || '');
      setLocalPhotoUrl(initialPhotoUrl || '');
      setLocalPhoto(null);
      setAdvice(null);
      setErrorMessage('');
    }
  }, [isOpen, initialPlantType, initialPhotoUrl]);

  // Loading text cycling
  useEffect(() => {
    if (state !== 'loading') return;
    const texts = ['Identifying your plant...', 'Analyzing care needs...', 'Generating advice...'];
    let idx = 0;
    setLoadingText(texts[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setLoadingText(texts[idx]);
    }, 1500);
    return () => clearInterval(interval);
  }, [state]);

  const canSubmit = localPlantType.trim() || localPhotoUrl;

  const handleGetAdvice = async () => {
    setState('loading');
    try {
      const payload = {};
      if (localPlantType.trim()) payload.plant_type = localPlantType.trim();
      if (localPhotoUrl) payload.photo_url = localPhotoUrl;

      const data = await ai.getAdvice(payload);
      setAdvice(data);
      setState('results');
    } catch (err) {
      if (err.code === 'PLANT_NOT_IDENTIFIABLE') {
        setErrorMessage("We couldn't identify the plant from this photo. Try a clearer photo or enter the plant type manually.");
      } else if (err.code === 'AI_SERVICE_UNAVAILABLE') {
        setErrorMessage('Our AI is temporarily unavailable. Try again in a moment.');
      } else {
        setErrorMessage('Check your internet connection and try again.');
      }
      setState('error');
    }
  };

  const handleAccept = () => {
    if (advice && onAccept) {
      onAccept(advice);
    }
    onClose();
  };

  const handleStartOver = () => {
    setState('input');
    setAdvice(null);
    setErrorMessage('');
  };

  const renderInput = () => (
    <>
      <p className="ai-modal-subtitle">Tell us about your plant and we'll recommend the best care routine.</p>

      <div className="ai-modal-section">
        <label className="ai-modal-label">Upload a Photo</label>
        <PhotoUpload
          value={localPhoto}
          previewUrl={localPhotoUrl}
          onChange={(file) => {
            setLocalPhoto(file);
            setLocalPhotoUrl(URL.createObjectURL(file));
          }}
          onRemove={() => { setLocalPhoto(null); setLocalPhotoUrl(''); }}
          compact
        />
        <p className="ai-modal-caption">We'll identify your plant from the photo.</p>
      </div>

      <div className="ai-modal-divider">
        <span>or</span>
      </div>

      <div className="ai-modal-section">
        <label className="ai-modal-label" htmlFor="ai-plant-type">Enter Plant Type</label>
        <input
          id="ai-plant-type"
          type="text"
          className="input-field"
          placeholder="e.g. 'Spider Plant', 'Fiddle Leaf Fig'..."
          value={localPlantType}
          onChange={(e) => setLocalPlantType(e.target.value)}
        />
        <p className="ai-modal-caption">Know what it is? Just type the name.</p>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handleGetAdvice}
        disabled={!canSubmit}
        className="ai-modal-submit"
      >
        <Sparkle size={18} />
        Get AI Advice
      </Button>
    </>
  );

  const renderLoading = () => (
    <div className="ai-modal-loading" aria-busy="true" aria-label="Loading AI advice">
      <div className="ai-modal-spinner" />
      <p className="ai-loading-text">{loadingText}</p>
      <Button variant="ghost" onClick={() => { setState('input'); }}>
        Cancel
      </Button>
    </div>
  );

  const renderResults = () => {
    if (!advice) return null;
    const { identified_plant_type, confidence, care_advice } = advice;

    return (
      <div aria-live="polite">
        {identified_plant_type && (
          <div className="ai-plant-banner">
            <p>We think this is a <strong>{identified_plant_type}</strong></p>
            {confidence && <p className="ai-confidence">Confidence: {confidence}</p>}
            <p className="ai-disclaimer">AI identification may not be 100% accurate.</p>
          </div>
        )}

        <div className="ai-advice-grid">
          {care_advice.watering && (
            <div className="ai-advice-card">
              <Drop size={24} color="#5C7A5C" />
              <span className="ai-advice-label">Watering</span>
              <span className="ai-advice-value">Every {care_advice.watering.frequency_value} {care_advice.watering.frequency_unit}</span>
              {care_advice.watering.notes && <span className="ai-advice-note">{care_advice.watering.notes}</span>}
            </div>
          )}
          {care_advice.fertilizing && (
            <div className="ai-advice-card">
              <Leaf size={24} color="#5C7A5C" />
              <span className="ai-advice-label">Fertilizing</span>
              <span className="ai-advice-value">Every {care_advice.fertilizing.frequency_value} {care_advice.fertilizing.frequency_unit}</span>
              {care_advice.fertilizing.notes && <span className="ai-advice-note">{care_advice.fertilizing.notes}</span>}
            </div>
          )}
          {care_advice.repotting && (
            <div className="ai-advice-card">
              <PottedPlant size={24} color="#5C7A5C" />
              <span className="ai-advice-label">Repotting</span>
              <span className="ai-advice-value">Every {care_advice.repotting.frequency_value} {care_advice.repotting.frequency_unit}</span>
              {care_advice.repotting.notes && <span className="ai-advice-note">{care_advice.repotting.notes}</span>}
            </div>
          )}
          {care_advice.light && (
            <div className="ai-advice-card">
              <Sun size={24} color="#C4921F" />
              <span className="ai-advice-label">Light</span>
              <span className="ai-advice-value">{care_advice.light}</span>
            </div>
          )}
          {care_advice.humidity && (
            <div className="ai-advice-card">
              <CloudRain size={24} color="#5C7A5C" />
              <span className="ai-advice-label">Humidity</span>
              <span className="ai-advice-value">{care_advice.humidity}</span>
            </div>
          )}
        </div>

        {care_advice.additional_tips && (
          <div className="ai-tips">
            <Lightbulb size={18} />
            <div>
              <strong>Care Tips</strong>
              <p>{care_advice.additional_tips}</p>
            </div>
          </div>
        )}

        <div className="ai-modal-actions">
          <Button variant="primary" fullWidth onClick={handleAccept}>
            Accept & Fill Form
          </Button>
          <Button variant="ghost" onClick={handleStartOver}>
            Start Over
          </Button>
        </div>
      </div>
    );
  };

  const renderError = () => (
    <div className="ai-modal-error">
      <div className="ai-error-icon">!</div>
      <h3>Couldn't get advice right now</h3>
      <p>{errorMessage}</p>
      <div className="ai-modal-actions">
        <Button variant="secondary" onClick={handleStartOver}>
          Try Again
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={state !== 'loading' ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkle size={20} color="#5C7A5C" /> Get AI Care Advice
        </span>
      ) : null}
      width={560}
    >
      {state === 'input' && renderInput()}
      {state === 'loading' && renderLoading()}
      {state === 'results' && renderResults()}
      {state === 'error' && renderError()}
    </Modal>
  );
}
