import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkle } from '@phosphor-icons/react';
import { plants as plantsApi } from '../utils/api.js';
import { useToast } from '../hooks/useToast.jsx';
import { validatePlantName, validateFrequencyValue } from '../utils/validation.js';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import PhotoUpload from '../components/PhotoUpload.jsx';
import CareScheduleForm from '../components/CareScheduleForm.jsx';
import AIAdviceModal from '../components/AIAdviceModal.jsx';
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

  const canAI = type.trim() || photoUrl;

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
    if (advice.identified_plant_type && !type.trim()) {
      setType(advice.identified_plant_type);
      filled.push('type');
    }

    if (advice.care_advice?.watering) {
      const w = advice.care_advice.watering;
      setWatering({ value: String(w.frequency_value), unit: w.frequency_unit });
      filled.push('watering');
    }

    if (advice.care_advice?.fertilizing) {
      const f = advice.care_advice.fertilizing;
      let unit = f.frequency_unit;
      let val = f.frequency_value;
      // Convert years to months for storage
      if (unit === 'years') {
        unit = 'months';
        val = val * 12;
      }
      setFertilizing({ value: String(val), unit });
      setFertilizingExpanded(true);
      filled.push('fertilizing');
    }

    if (advice.care_advice?.repotting) {
      const r = advice.care_advice.repotting;
      let unit = r.frequency_unit;
      let val = r.frequency_value;
      if (unit === 'years') {
        unit = 'months';
        val = val * 12;
      }
      setRepotting({ value: String(val), unit });
      setRepottingExpanded(true);
      filled.push('repotting');
    }

    setAiFilledFields(filled);
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
            value={name}
            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: null })); }}
            error={errors.name}
            placeholder="e.g. 'Lola the Pothos'"
            disabled={saving}
          />
          <Input
            label="Plant Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. 'Pothos', 'Spider Plant'..."
            disabled={saving}
            className={aiFilledFields.includes('type') ? 'ai-filled-input' : ''}
          />
          {aiFilledFields.includes('type') && <span className="ai-badge">Filled by AI</span>}
          <div className="input-group">
            <label className="input-label">Notes</label>
            <textarea
              className="input-field"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes about this plant..."
              disabled={saving}
            />
          </div>
        </section>

        {/* AI Advice card */}
        <section className="ai-advice-card-section">
          <div className="ai-advice-prompt">
            <div>
              <h3 className="ai-advice-heading">
                <Sparkle size={18} color="#5C7A5C" /> Get AI Care Advice
              </h3>
              <p className="ai-advice-desc">Upload a photo or enter the plant type above, then let our AI recommend a care schedule.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowAI(true)}
              disabled={!canAI || saving}
              title={!canAI ? 'Add a photo or plant type first' : undefined}
            >
              <Sparkle size={16} />
              Get AI Advice
            </Button>
          </div>
        </section>

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

      <AIAdviceModal
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        plantType={type}
        photoUrl={photoUrl}
        onAccept={handleAIAccept}
      />
    </div>
  );
}
