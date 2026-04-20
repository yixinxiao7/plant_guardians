import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Leaf,
  Drop,
  Flask,
  Flower,
  WarningCircle,
  WifiSlash,
  Sparkle,
  Plant as PlantIcon,
} from '@phosphor-icons/react';
import { plantShares, ApiError } from '../utils/api.js';
import './PublicPlantPage.css';

/**
 * PublicPlantPage — Sprint 28 / SPEC-022
 *
 * Public, no-auth-required read-only plant profile. Renders plant name,
 * species, optional photo, care schedule chips, and AI care notes. Does
 * not include care history, overdue status, or any user-identifiable data.
 *
 * Route: /plants/share/:shareToken (registered as a non-protected route
 * in App.jsx so unauthenticated visitors can view).
 */

const STATE = {
  LOADING: 'loading',
  SUCCESS: 'success',
  NOT_FOUND: 'not_found',
  ERROR: 'error',
};

function MinimalHeader() {
  return (
    <header className="public-header" role="banner">
      <Link to="/" className="public-header-brand" aria-label="Plant Guardians home">
        <span className="public-header-brand-leaf" aria-hidden="true">
          <PlantIcon size={22} weight="fill" />
        </span>
        <span>Plant Guardians</span>
      </Link>
    </header>
  );
}

function DiscoverCTA() {
  return (
    <section className="public-cta" aria-label="Discover Plant Guardians">
      <div className="public-cta-leaf" aria-hidden="true">🌱</div>
      <h2 className="public-cta-headline">
        Track your own plants with Plant Guardians
      </h2>
      <p className="public-cta-sub">Free to use. No green thumb required.</p>
      <Link to="/" className="public-cta-button">
        Get started for free
      </Link>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <main
      className="public-main"
      role="main"
      aria-busy="true"
      aria-label="Loading plant profile"
    >
      <div className="public-skeleton">
        <div className="public-skel-block public-skel-photo" />
        <div className="public-skel-block public-skel-name" />
        <div className="public-skel-block public-skel-species" />
        <div className="public-skel-block public-skel-section-label" />
        <div className="public-skel-chip-row">
          <div className="public-skel-block public-skel-chip" />
          <div className="public-skel-block public-skel-chip" />
          <div className="public-skel-block public-skel-chip" />
        </div>
      </div>
    </main>
  );
}

function NotFoundState() {
  return (
    <main className="public-state" role="main">
      <span className="public-state-icon" aria-hidden="true">
        <WarningCircle size={64} weight="regular" />
      </span>
      <div role="alert">
        <h1 className="public-state-headline">
          This plant link is no longer active
        </h1>
        <p className="public-state-sub">
          The link may have been removed or it never existed.
        </p>
      </div>
      <div className="public-state-actions">
        <Link to="/" className="public-cta-button">
          Get started for free
        </Link>
      </div>
    </main>
  );
}

function ErrorState({ onRetry, retrying }) {
  return (
    <main className="public-state" role="main">
      <span className="public-state-icon" aria-hidden="true">
        <WifiSlash size={64} weight="regular" />
      </span>
      <div role="alert">
        <h1 className="public-state-headline">Something went wrong</h1>
        <p className="public-state-sub">
          We couldn't load this plant profile. Please try again.
        </p>
      </div>
      <div className="public-state-actions">
        <button
          type="button"
          className="public-state-retry"
          onClick={onRetry}
          disabled={retrying}
          aria-busy={retrying ? 'true' : 'false'}
        >
          {retrying && (
            <span className="public-state-retry-spinner" aria-hidden="true" />
          )}
          Try again
        </button>
        <Link to="/" className="public-cta-button">
          Get started for free
        </Link>
      </div>
    </main>
  );
}

function CareChips({ plant }) {
  const chips = [];

  if (Number.isFinite(plant.watering_frequency_days)) {
    chips.push(
      <li key="water" className="public-care-chip" role="listitem">
        <span className="public-care-chip-icon public-care-chip-icon--water" aria-hidden="true">
          <Drop size={14} weight="regular" />
        </span>
        Water every {plant.watering_frequency_days}{' '}
        {plant.watering_frequency_days === 1 ? 'day' : 'days'}
      </li>,
    );
  }

  if (Number.isFinite(plant.fertilizing_frequency_days)) {
    chips.push(
      <li key="fert" className="public-care-chip" role="listitem">
        <span className="public-care-chip-icon public-care-chip-icon--fert" aria-hidden="true">
          <Flask size={14} weight="regular" />
        </span>
        Fertilize every {plant.fertilizing_frequency_days}{' '}
        {plant.fertilizing_frequency_days === 1 ? 'day' : 'days'}
      </li>,
    );
  }

  if (Number.isFinite(plant.repotting_frequency_days)) {
    chips.push(
      <li key="repot" className="public-care-chip" role="listitem">
        <span className="public-care-chip-icon public-care-chip-icon--repot" aria-hidden="true">
          <Flower size={14} weight="regular" />
        </span>
        Repot every {plant.repotting_frequency_days}{' '}
        {plant.repotting_frequency_days === 1 ? 'day' : 'days'}
      </li>,
    );
  }

  if (chips.length === 0) {
    return (
      <ul className="public-care-chips" role="list">
        <li className="public-care-chip public-care-chip--muted" role="listitem">
          No schedule set
        </li>
      </ul>
    );
  }

  return (
    <ul className="public-care-chips" role="list">
      {chips}
    </ul>
  );
}

function SuccessState({ plant }) {
  const hasNotes =
    typeof plant.ai_care_notes === 'string' && plant.ai_care_notes.trim() !== '';

  return (
    <main className="public-main" role="main">
      {plant.photo_url && (
        <img
          src={plant.photo_url}
          alt={`Photo of ${plant.name}`}
          className="public-photo"
        />
      )}
      <h1
        className={`public-name ${plant.photo_url ? 'public-name--with-photo' : ''}`}
      >
        {plant.name}
      </h1>

      {plant.species && (
        <span className="public-species-chip">
          <span className="public-species-chip-icon" aria-hidden="true">
            <Leaf size={14} weight="regular" />
          </span>
          {plant.species}
        </span>
      )}

      <section className="public-section" aria-label="Care Schedule">
        <div className="public-section-header">
          <h2 className="public-section-label">Care Schedule</h2>
          <hr className="public-section-rule" aria-hidden="true" />
        </div>
        <CareChips plant={plant} />
      </section>

      {hasNotes && (
        <section className="public-section" aria-label="AI Care Notes">
          <div className="public-section-header">
            <h2 className="public-section-label">AI Care Notes</h2>
            <hr className="public-section-rule" aria-hidden="true" />
          </div>
          <div className="public-ai-notes">
            <p className="public-ai-notes-text">{plant.ai_care_notes}</p>
            <div className="public-ai-notes-attribution">
              <span className="public-ai-notes-attribution-icon" aria-hidden="true">
                <Sparkle size={12} weight="regular" />
              </span>
              Generated by AI — always verify plant care advice
            </div>
          </div>
        </section>
      )}

      <DiscoverCTA />
    </main>
  );
}

export default function PublicPlantPage() {
  const { shareToken } = useParams();
  const [state, setState] = useState(STATE.LOADING);
  const [plant, setPlant] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const fetchPlant = useCallback(
    async (isRetry = false) => {
      if (isRetry) setRetrying(true);
      else setState(STATE.LOADING);

      try {
        const data = await plantShares.getPublic(shareToken);
        setPlant(data);
        setState(STATE.SUCCESS);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setState(STATE.NOT_FOUND);
        } else {
          setState(STATE.ERROR);
        }
      } finally {
        setRetrying(false);
      }
    },
    [shareToken],
  );

  useEffect(() => {
    // Guard against missing token in URL (shouldn't happen given the route
    // pattern, but handle defensively).
    if (!shareToken) {
      setState(STATE.NOT_FOUND);
      return;
    }
    fetchPlant(false);
  }, [shareToken, fetchPlant]);

  // Set document title based on state.
  useEffect(() => {
    const prev = document.title;
    if (state === STATE.SUCCESS && plant?.name) {
      document.title = `${plant.name}'s Care Profile — Plant Guardians`;
    } else if (state === STATE.NOT_FOUND) {
      document.title = 'Plant not found — Plant Guardians';
    } else if (state === STATE.ERROR) {
      document.title = 'Error — Plant Guardians';
    } else {
      document.title = 'Plant Guardians';
    }
    return () => {
      document.title = prev;
    };
  }, [state, plant]);

  return (
    <div className="public-page">
      <MinimalHeader />
      {state === STATE.LOADING && <LoadingSkeleton />}
      {state === STATE.SUCCESS && plant && <SuccessState plant={plant} />}
      {state === STATE.NOT_FOUND && <NotFoundState />}
      {state === STATE.ERROR && (
        <ErrorState onRetry={() => fetchPlant(true)} retrying={retrying} />
      )}
    </div>
  );
}
