import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkle } from '@phosphor-icons/react';
import { plants as plantsApi } from '../utils/api.js';
import { useToast } from '../hooks/useToast.js';
import { usePlantDetail } from '../hooks/usePlants.js';
import { validatePlantName, validateFrequencyValue } from '../utils/validation.js';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import PhotoUpload from '../components/PhotoUpload.jsx';
import CareScheduleForm from '../components/CareScheduleForm.jsx';
import AIAdviceModal from '../components/AIAdviceModal.jsx';
import './PlantFormPage.css';

export default function EditPlantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { plant, loading, error, notFound, fetchPlant } = usePlantDetail();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');

  const [watering, setWatering] = useState({ value: '', unit: 'days' });
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchPlant(id).catch(() => {});
  }, [id, fetchPlant]);

  // Populate form when plant data loads
  useEffect(() => {
    if (plant && !initialized) {
      setName(plant.name || '');
      setType(plant.type || '');
      setNotes(plant.notes || '');
      setPhotoUrl(plant.photo_url || '');

      const waterSchedule = plant.care_schedules?.find(s => s.care_type === 'watering');
      if (waterSchedule) {
        setWatering({ value: String(waterSchedule.frequency_value), unit: waterSchedule.frequency_unit });
        setWateringLastDone(waterSchedule.last_done_at ? waterSchedule.last_done_at.split('T')[0] : '');
      }

      const fertSchedule = plant.care_schedules?.find(s => s.care_type === 'fertilizing');
      if (fertSchedule) {
        setFertilizing({ value: String(fertSchedule.frequency_value), unit: fertSchedule.frequency_unit });
        setFertilizingLastDone(fertSchedule.last_done_at ? fertSchedule.last_done_at.split('T')[0] : '');
        setFertilizingExpanded(true);
      }

      const repotSchedule = plant.care_schedules?.find(s => s.care_type === 'repotting');
      if (repotSchedule) {
        setRepotting({ value: String(repotSchedule.frequency_value), unit: repotSchedule.frequency_unit });
        setRepottingLastDone(repotSchedule.last_done_at ? repotSchedule.last_done_at.split('T')[0] : '');
        setRepottingExpanded(true);
      }

      setInitialized(true);
    }
  }, [plant, initialized]);

  // Dirty state detection
  const isDirty = useMemo(() => {
    if (!plant || !initialized) return false;
    if (name !== (plant.name || '')) return true;
    if (type !== (plant.type || '')) return true;
    if (notes !== (plant.notes || '')) return true;
    if (photo) return true; // new photo uploaded
    // Check watering
    const origWater = plant.care_schedules?.find(s => s.care_type === 'watering');
    if (origWater) {
      if (watering.value !== String(origWater.frequency_value)) return true;
      if (watering.unit !== origWater.frequency_unit) return true;
    } else if (watering.value) return true;
    // Check fertilizing
    const origFert = plant.care_schedules?.find(s => s.care_type === 'fertilizing');
    if (fertilizingExpanded && !origFert) return true;
    if (!fertilizingExpanded && origFert) return true;
    if (origFert && fertilizingExpanded) {
      if (fertilizing.value !== String(origFert.frequency_value)) return true;
      if (fertilizing.unit !== origFert.frequency_unit) return true;
    }
    // Check repotting
    const origRepot = plant.care_schedules?.find(s => s.care_type === 'repotting');
    if (repottingExpanded && !origRepot) return true;
    if (!repottingExpanded && origRepot) return true;
    if (origRepot && repottingExpanded) {
      if (repotting.value !== String(origRepot.frequency_value)) return true;
      if (repotting.unit !== origRepot.frequency_unit) return true;
    }
    return false;
  }, [plant, initialized, name, type, notes, photo, watering, fertilizing, fertilizingExpanded, repotting, repottingExpanded]);

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

      let finalPhotoUrl = photoUrl;
      if (photo) {
        try {
          const photoData = await plantsApi.uploadPhoto(id, photo);
          finalPhotoUrl = photoData.photo_url;
        } catch {
          addToast('Photo upload failed.', 'error');
        }
      }

      await plantsApi.update(id, {
        name: name.trim(),
        type: type.trim() || null,
        notes: notes.trim() || null,
        photo_url: finalPhotoUrl || null,
        care_schedules: careSchedules,
      });

      addToast('Changes saved.', 'success');
      navigate(`/plants/${id}`);
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Try again.');
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
      setWatering({ value: String(advice.care_advice.watering.frequency_value), unit: advice.care_advice.watering.frequency_unit });
      filled.push('watering');
    }
    if (advice.care_advice?.fertilizing) {
      let unit = advice.care_advice.fertilizing.frequency_unit;
      let val = advice.care_advice.fertilizing.frequency_value;
      if (unit === 'years') { unit = 'months'; val *= 12; }
      setFertilizing({ value: String(val), unit });
      setFertilizingExpanded(true);
      filled.push('fertilizing');
    }
    if (advice.care_advice?.repotting) {
      let unit = advice.care_advice.repotting.frequency_unit;
      let val = advice.care_advice.repotting.frequency_value;
      if (unit === 'years') { unit = 'months'; val *= 12; }
      setRepotting({ value: String(val), unit });
      setRepottingExpanded(true);
      filled.push('repotting');
    }
    setAiFilledFields(filled);
    setTimeout(() => setAiFilledFields([]), 5000);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="plant-form-skeleton">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-photo" />
        <div className="skeleton skeleton-field" />
        <div className="skeleton skeleton-field" />
        <div className="skeleton skeleton-textarea" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="plant-not-found">
        <h2>This plant wasn't found.</h2>
        <p>It may have been removed.</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to Inventory
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plant-not-found">
        <p>Couldn't load plant data. Refresh to try again.</p>
        <Button variant="secondary" onClick={() => fetchPlant(id)}>
          Retry
        </Button>
      </div>
    );
  }

  const canAI = type.trim() || photoUrl;

  return (
    <div className="plant-form-page">
      <h1 className="plant-form-title">Edit {plant?.name || 'Plant'}</h1>

      <form onSubmit={handleSubmit} noValidate className="plant-form">
        {formError && <div className="plant-form-error" role="alert">{formError}</div>}

        <section className="plant-form-section">
          <PhotoUpload
            value={photo}
            previewUrl={photoUrl || undefined}
            onChange={(file) => { setPhoto(file); setPhotoUrl(URL.createObjectURL(file)); }}
            onRemove={() => { setPhoto(null); setPhotoUrl(''); }}
          />
        </section>

        <section className="plant-form-section">
          <Input label="Plant Name" required value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: null })); }} error={errors.name} disabled={saving} autoFocus />
          <Input label="Plant Type" value={type} onChange={(e) => setType(e.target.value)} disabled={saving} className={aiFilledFields.includes('type') ? 'ai-filled-input' : ''} />
          {aiFilledFields.includes('type') && <span className="ai-badge">Filled by AI</span>}
          <div className="input-group">
            <label className="input-label">Notes</label>
            <textarea className="input-field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={saving} />
          </div>
        </section>

        <section className="ai-advice-card-section">
          <div className="ai-advice-prompt">
            <div>
              <h3 className="ai-advice-heading"><Sparkle size={18} color="#5C7A5C" /> Get AI Care Advice</h3>
              <p className="ai-advice-desc">Get fresh AI recommendations to update the care schedule.</p>
            </div>
            <Button variant="secondary" onClick={() => setShowAI(true)} disabled={!canAI || saving}>
              <Sparkle size={16} /> Get AI Advice
            </Button>
          </div>
        </section>

        <section className="plant-form-section">
          <h2 className="plant-form-section-title">Care Schedule</h2>
          <CareScheduleForm careType="watering" label="Watering" required expanded frequency={watering} onFrequencyChange={setWatering} lastDoneAt={wateringLastDone} onLastDoneChange={setWateringLastDone} errors={{ value: errors.wateringValue }} aiFilledFields={aiFilledFields.includes('watering') ? ['value', 'unit'] : []} />
          <CareScheduleForm careType="fertilizing" label="Fertilizing" expanded={fertilizingExpanded} frequency={fertilizing} onFrequencyChange={(f) => { setFertilizing(f); if (!fertilizingExpanded) setFertilizingExpanded(true); }} lastDoneAt={fertilizingLastDone} onLastDoneChange={setFertilizingLastDone} errors={{ value: errors.fertilizingValue }} aiFilledFields={aiFilledFields.includes('fertilizing') ? ['value', 'unit'] : []} />
          <CareScheduleForm careType="repotting" label="Repotting" expanded={repottingExpanded} frequency={repotting} onFrequencyChange={(f) => { setRepotting(f); if (!repottingExpanded) setRepottingExpanded(true); }} lastDoneAt={repottingLastDone} onLastDoneChange={setRepottingLastDone} errors={{ value: errors.repottingValue }} aiFilledFields={aiFilledFields.includes('repotting') ? ['value', 'unit'] : []} />
        </section>

        <div className="plant-form-actions">
          <Button variant="ghost" onClick={() => navigate(`/plants/${id}`)} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!isDirty || saving}>Save Changes</Button>
        </div>
      </form>

      <AIAdviceModal isOpen={showAI} onClose={() => setShowAI(false)} plantType={type} photoUrl={photoUrl} onAccept={handleAIAccept} />
    </div>
  );
}
