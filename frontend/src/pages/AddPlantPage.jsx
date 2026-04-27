import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkle } from '@phosphor-icons/react';
import { plants as plantsApi } from '../utils/api.js';
import { useToast } from '../hooks/useToast.jsx';
import { validatePlantName, validateFrequencyValue } from '../utils/validation.js';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import PhotoUpload from '../components/PhotoUpload.jsx';
import CareScheduleForm from '../components/CareScheduleForm.jsx';
import AIAdvicePanel from '../components/AIAdvicePanel.jsx';
import './PlantFormPage.css';

export default function AddPlantPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');

  const [watering, setWatering] = useState({ value: '7', unit: 'days' });
  const [wateringLastDone, setWateringLastDone] = useState('');
  const [fertilizing, setFertilizing] = useState({ value: '', unit: 'months' });
  const [fertilizingExpanded, setFertilizingExpanded] = useState(false);
  const [fertilizingLastDone, setFertilizingLastDone] = useState('');
  const [repotting, setRepotting] = useState({ value: '', unit: 'months' });
  const [repottingExpanded, setRepottingExpanded] = useState(false);
  const [repottingLastDone, setRepottingLastDone] = useState('');

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState([]);

  const aiButtonRef = useRef(null);

  const validate = () => {
    const errs = {};
    const nameErr = validatePlantName(name);
    if (nameErr) errs.name = nameErr;

    const waterValErr = validateFrequencyValue(watering.value);
    if (waterValErr) errs.wateringValue = waterValErr;

    if (fertilizingExpanded && fertilizing.value) {
      const fertErr = validateFrequencyValue(fertilizing.value);
      if (fertErr) errs.fertilizingValue = fertErr;
    }

    if (repottingExpanded && repotting.value) {
      const repotErr = validateFrequencyValue(repotting.value);
      if (repotErr) errs.repottingValue = repotErr;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSaving(true);
    try {
      // Build care schedules
      const careSchedules = [];
      careSchedules.push({
        care_type: 'watering',
        frequency_value: parseInt(watering.value),
        frequency_unit: watering.unit,
        last_done_at: wateringLastDone ? new Date(wateringLastDone).toISOString() : null,
      });

      if (fertilizingExpanded && fertilizing.value) {
        careSchedules.push({
          care_type: 'fertilizing',
          frequency_value: parseInt(fertilizing.value),
          frequency_unit: fertilizing.unit,
          last_done_at: fertilizingLastDone ? new Date(fertilizingLastDone).toISOString() : null,
        });
      }

      if (repottingExpanded && repotting.value) {
        careSchedules.push({
          care_type: 'repotting',
          frequency_value: parseInt(repotting.value),
          frequency_unit: repotting.unit,
          last_done_at: repottingLastDone ? new Date(repottingLastDone).toISOString() : null,
        });
      }

      // Upload photo first if present
      let finalPhotoUrl = photoUrl;
      if (photo && !photoUrl.startsWith('http')) {
        // We need a temp plant to upload to — create plant first, then upload
        // Actually, per API contract: create plant first, then upload photo and update
      }

      const plantData = {
        name: name.trim(),
        type: type.trim() || null,
        notes: notes.trim() || null,
        photo_url: finalPhotoUrl || null,
        care_schedules: careSchedules,
      };

      const created = await plantsApi.create(plantData);

      // Upload photo if we have one
      if (photo && created.id) {
        try {
          const photoData = await plantsApi.uploadPhoto(created.id, photo);
          await plantsApi.update(created.id, { ...plantData, photo_url: photoData.photo_url });
        } catch {
          // Photo upload failed, plant still created
          addToast('Plant created but photo upload failed.', 'error');
        }
      }

      addToast(`${name} has been added!`, 'success');
      navigate('/');
    } catch (err) {
      setFormError(err.message || 'Something went wrong saving your plant. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAIAccept = (advice) => {
    const filled = [];

    // New Sprint 17 response shape: flat care object with *_interval_days
    if (advice.identified_plant && !type.trim()) {
      setType(advice.identified_plant);
      filled.push('type');
    }

    if (advice.care?.watering_interval_days != null) {
      setWatering({ value: String(advice.care.watering_interval_days), unit: 'days' });
      filled.push('watering');
    }

    if (advice.care?.fertilizing_interval_days != null) {
      setFertilizing({ value: String(advice.care.fertilizing_interval_days), unit: 'days' });
      setFertilizingExpanded(true);
      filled.push('fertilizing');
    }

    if (advice.care?.repotting_interval_days != null) {
      setRepotting({ value: String(advice.care.repotting_interval_days), unit: 'days' });
      setRepottingExpanded(true);
      filled.push('repotting');
    }

    setAiFilledFields(filled);
    addToast('AI advice applied! Review and save your plant.', 'success');
    // Clear AI badges after 5 seconds
    setTimeout(() => setAiFilledFields([]), 5000);
  };

  return (
    <div className="plant-form-page">
      <h1 className="plant-form-title">Add a New Plant</h1>
      <p className="plant-form-subtitle">Tell us about your plant so we can help you care for it.</p>

      <form onSubmit={handleSubmit} noValidate className="plant-form">
        {formError && (
          <div className="plant-form-error" role="alert">{formError}</div>
        )}

        {/* Photo */}
        <section className="plant-form-section">
          <PhotoUpload
            value={photo}
            previewUrl={photoUrl.startsWith('blob:') || photoUrl.startsWith('http') ? photoUrl : null}
            onChange={(file) => {
              setPhoto(file);
              setPhotoUrl(URL.createObjectURL(file));
            }}
            onRemove={() => { setPhoto(null); setPhotoUrl(''); }}
          />
        </section>

        {/* Plant Info */}
        <section className="plant-form-section">
          <Input
            label="Plant Name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: null })); }}
            error={errors.name}
            placeholder="e.g. 'Lola the Pothos'"
            disabled={saving}
          />
          <Input
            label="Plant Type"
            maxLength={80}
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. 'Pothos', 'Spider Plant'..."
            disabled={saving}
            className={aiFilledFields.includes('type') ? 'ai-filled-input' : ''}
          />
          {aiFilledFields.includes('type') && <span className="ai-badge">Filled by AI</span>}
          <div className="input-group">
            <label className="input-label" htmlFor="plant-notes">Notes</label>
            <textarea
              id="plant-notes"
              className="input-field"
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes about this plant..."
              disabled={saving}
            />
          </div>
        </section>

        {/* AI Advice trigger */}
        <div className="ai-advice-trigger">
          <Button
            ref={aiButtonRef}
            variant="secondary"
            onClick={() => setShowAI(true)}
            disabled={saving}
          >
            <Sparkle size={16} />
            ✦ Get AI Advice
          </Button>
        </div>

        {/* Care Schedule */}
        <section className="plant-form-section">
          <h2 className="plant-form-section-title">Care Schedule</h2>

          <CareScheduleForm
            careType="watering"
            label="Watering"
            required
            expanded
            frequency={watering}
            onFrequencyChange={setWatering}
            lastDoneAt={wateringLastDone}
            onLastDoneChange={setWateringLastDone}
            errors={{ value: errors.wateringValue }}
            aiFilledFields={aiFilledFields.includes('watering') ? ['value', 'unit'] : []}
          />

          <CareScheduleForm
            careType="fertilizing"
            label="Fertilizing"
            expanded={fertilizingExpanded}
            onExpand={() => setFertilizingExpanded(true)}
            frequency={fertilizing}
            onFrequencyChange={(f) => { setFertilizing(f); if (!fertilizingExpanded) setFertilizingExpanded(true); }}
            lastDoneAt={fertilizingLastDone}
            onLastDoneChange={setFertilizingLastDone}
            errors={{ value: errors.fertilizingValue }}
            aiFilledFields={aiFilledFields.includes('fertilizing') ? ['value', 'unit'] : []}
          />

          <CareScheduleForm
            careType="repotting"
            label="Repotting"
            expanded={repottingExpanded}
            onExpand={() => setRepottingExpanded(true)}
            frequency={repotting}
            onFrequencyChange={(f) => { setRepotting(f); if (!repottingExpanded) setRepottingExpanded(true); }}
            lastDoneAt={repottingLastDone}
            onLastDoneChange={setRepottingLastDone}
            errors={{ value: errors.repottingValue }}
            aiFilledFields={aiFilledFields.includes('repotting') ? ['value', 'unit'] : []}
          />
        </section>

        {/* Actions */}
        <div className="plant-form-actions">
          <Button variant="ghost" onClick={() => navigate('/')} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Save Plant
          </Button>
        </div>
      </form>

      <AIAdvicePanel
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        onAccept={handleAIAccept}
        initialPlantType={type}
      />
    </div>
  );
}
