import { useRef, useState } from 'react';
import { Image, Camera, X } from '@phosphor-icons/react';
import { validatePhotoFile } from '../utils/validation.js';
import './PhotoUpload.css';

export default function PhotoUpload({ value, previewUrl, onChange, onRemove, error: externalError, compact = false }) {
  const fileRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const displayError = externalError || error;

  const handleFile = (file) => {
    const err = validatePhotoFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const preview = previewUrl || (value ? URL.createObjectURL(value) : null);

  return (
    <div className={`photo-upload ${compact ? 'photo-upload-compact' : ''}`}>
      <div
        className={`photo-upload-zone ${dragActive ? 'drag-active' : ''} ${preview ? 'has-preview' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload plant photo"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Plant preview" className="photo-upload-preview" />
            <div className="photo-upload-overlay">
              <Camera size={24} />
              <span>Change photo</span>
            </div>
          </>
        ) : (
          <div className="photo-upload-empty">
            <Image size={40} color="#B8CEB8" />
            <p className="photo-upload-text">Upload a photo</p>
            <p className="photo-upload-hint">JPG, PNG up to 5MB</p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {preview && onRemove && (
        <button type="button" className="photo-upload-remove" onClick={onRemove}>
          <X size={14} /> Remove photo
        </button>
      )}

      {displayError && <span className="photo-upload-error">{displayError}</span>}
    </div>
  );
}
