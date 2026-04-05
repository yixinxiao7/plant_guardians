/**
 * StreakTile — Care streak card for the Profile page (SPEC-014 / T-091).
 * Handles all streak states: loading, empty (new user), broken, active, milestone.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plant, Fire, TrendUp } from '@phosphor-icons/react';
import Button from './Button.jsx';
import './StreakTile.css';

// Milestone thresholds that trigger celebration animation
const MILESTONE_VALUES = [7, 30, 100];

function isMilestone(streak) {
  return MILESTONE_VALUES.includes(streak);
}

function getStreakIcon(streak) {
  return streak >= 7 ? Fire : Plant;
}

function getMilestoneLabel(streak) {
  if (streak === 7) return '🎉 One week!';
  if (streak === 30) return '🌟 One month!';
  if (streak >= 100) return '🏆 100 days!';
  return null;
}

function getMotivationalMessage(streak) {
  if (streak === 1) return { text: 'Great start! 🌱 You\'ve begun your streak.', weight: 400 };
  if (streak >= 2 && streak <= 6) return { text: `Keep it up! ${streak} days and counting.`, weight: 400 };
  if (streak === 7) return { text: 'One week strong! 🌿 You\'re building a real habit.', weight: 500 };
  if (streak >= 8 && streak <= 29) return { text: `You're on a roll — ${streak} days of consistent care!`, weight: 400 };
  if (streak === 30) return { text: '30 days! 🌟 You\'re officially no longer a plant-killer.', weight: 600 };
  if (streak >= 31 && streak <= 99) return { text: `Your plants are so lucky to have you. ${streak} days!`, weight: 400 };
  if (streak === 100) return { text: '100 days! 🏆 You are a certified Plant Guardian.', weight: 600 };
  if (streak > 100) return { text: `${streak} days. Legendary. Your plants will outlive us all.`, weight: 500 };
  return { text: '', weight: 400 };
}

function getRelativeDate(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === todayStr) return 'today';
  if (dateStr === yesterdayStr) return 'yesterday';

  const diff = Math.floor((today - new Date(dateStr + 'T00:00:00')) / (1000 * 60 * 60 * 24));
  return `${diff} days ago`;
}

/**
 * Fire confetti for milestone celebrations.
 * Uses dynamic import so canvas-confetti is not bundled if unavailable.
 */
async function fireConfetti(particleCount) {
  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;
    confetti({
      particleCount,
      spread: 80,
      origin: { x: 0.5, y: 0.75 },
      startVelocity: 35,
      colors: ['#5C7A5C', '#A67C5B', '#C4921F', '#FFFFFF', '#4A7C59'],
    });
  } catch {
    // canvas-confetti not installed — skip silently
  }
}

// --- Sub-components ---

function StreakLoadingSkeleton() {
  return (
    <div className="streak-tile streak-tile--loading" aria-busy="true" aria-label="Loading streak data">
      <div className="streak-tile-header">
        <div className="skeleton streak-skeleton-title" style={{ width: '40%', height: 20 }} />
      </div>
      <div className="streak-tile-body">
        <div className="skeleton streak-skeleton-block" style={{ height: 100, borderRadius: 8 }} />
        <div className="skeleton streak-skeleton-block" style={{ height: 100, borderRadius: 8 }} />
      </div>
    </div>
  );
}

function StreakEmptyState() {
  const navigate = useNavigate();
  return (
    <div className="streak-tile">
      <div className="streak-tile-header">
        <span className="streak-tile-heading">Your Care Streak</span>
      </div>
      <div className="streak-empty">
        <Plant size={56} color="var(--color-streak-empty-icon)" aria-hidden="true" />
        <h3 className="streak-empty-heading">Start your streak today!</h3>
        <p className="streak-empty-body">
          Log your first care action to begin your streak. Come back every day and watch it grow.
        </p>
        <Button variant="secondary" onClick={() => navigate('/')} style={{ marginTop: 20 }}>
          Go to your plants
        </Button>
      </div>
    </div>
  );
}

function StreakBrokenState({ longestStreak, lastActionDate }) {
  return (
    <div className="streak-tile">
      <div className="streak-tile-header">
        <span className="streak-tile-heading">Your Care Streak</span>
        {lastActionDate && (
          <span className="streak-last-action-pill">
            Last cared: {getRelativeDate(lastActionDate)}
          </span>
        )}
      </div>
      <div className="streak-tile-body">
        <div className="streak-current" aria-label="Current care streak: 0 days">
          <Plant size={40} color="var(--color-streak-broken-icon)" aria-hidden="true" />
          <span className="streak-number streak-number--broken">0</span>
          <span className="streak-sub-label">day streak</span>
        </div>
        <div className="streak-longest" aria-label={`Longest streak: ${longestStreak} days`}>
          <TrendUp size={28} color="var(--color-streak-secondary-number)" aria-hidden="true" />
          <span className="streak-longest-number">{longestStreak}</span>
          <span className="streak-longest-label">personal best</span>
        </div>
      </div>
      <div className="streak-message" aria-live="polite">
        Your streak ended — but that's okay. 🌱 Every day is a fresh start.
      </div>
    </div>
  );
}

function StreakActiveState({ currentStreak, longestStreak, lastActionDate }) {
  const cardRef = useRef(null);
  const [celebrated, setCelebrated] = useState(false);

  const milestone = isMilestone(currentStreak);
  const milestoneLabel = getMilestoneLabel(currentStreak);
  const message = getMotivationalMessage(currentStreak);
  const StreakIcon = getStreakIcon(currentStreak);
  const isRecord = longestStreak === currentStreak && currentStreak >= 7;
  const showMilestoneBadge = currentStreak === 7 || currentStreak === 30 || currentStreak >= 100;

  // Milestone celebration animation
  useEffect(() => {
    if (!milestone || celebrated) return;
    const key = `streak_celebrated_${currentStreak}`;
    if (sessionStorage.getItem(key)) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      // Confetti particle counts per milestone
      const counts = { 7: 60, 30: 90, 100: 130 };
      fireConfetti(counts[currentStreak] || 130);

      // Pop animation on the card
      if (cardRef.current) {
        cardRef.current.classList.add('streak-tile--pop');
        const onEnd = () => cardRef.current?.classList.remove('streak-tile--pop');
        cardRef.current.addEventListener('animationend', onEnd, { once: true });
      }
    }

    sessionStorage.setItem(key, 'true');
    setCelebrated(true);
  }, [milestone, currentStreak, celebrated]);

  const isHighStreak = currentStreak >= 7;

  return (
    <div
      ref={cardRef}
      className={`streak-tile ${milestone ? 'streak-tile--milestone' : ''}`}
    >
      <div className="streak-tile-header">
        <span className="streak-tile-heading">Your Care Streak</span>
        {lastActionDate && (
          <span className="streak-last-action-pill">
            Last cared: {getRelativeDate(lastActionDate)}
          </span>
        )}
      </div>
      <div className="streak-tile-body">
        <div className="streak-current" aria-label={`Current care streak: ${currentStreak} days`}>
          <StreakIcon size={40} color={isHighStreak ? 'var(--color-streak-icon-fire)' : 'var(--color-streak-icon-leaf)'} aria-hidden="true" />
          <span className="streak-number">{currentStreak}</span>
          <span className="streak-sub-label">day streak</span>
          {showMilestoneBadge && milestoneLabel && (
            <span className="streak-milestone-badge" aria-label={`Milestone: ${currentStreak} day streak`}>
              {milestoneLabel}
            </span>
          )}
        </div>
        <div className="streak-longest" aria-label={`Longest streak: ${longestStreak} days`}>
          <TrendUp size={28} color="var(--color-streak-secondary-number)" aria-hidden="true" />
          <span className="streak-longest-number">{longestStreak}</span>
          <span className="streak-longest-label">personal best</span>
          {isRecord && (
            <span className="streak-record-note">(current record!)</span>
          )}
        </div>
      </div>
      <div
        className={`streak-message ${isHighStreak ? 'streak-message--highlight' : ''} ${message.weight >= 500 ? 'streak-message--bold' : ''}`}
        aria-live="polite"
      >
        {message.text}
      </div>
    </div>
  );
}

// --- Main export ---

export default function StreakTile({ data, loading, error }) {
  if (loading) return <StreakLoadingSkeleton />;
  if (error) return null; // Streak errors are non-critical; profile page still works
  if (!data) return null;

  const { currentStreak, longestStreak, lastActionDate } = data;

  // New user — no actions ever
  if (currentStreak === 0 && lastActionDate === null) {
    return <StreakEmptyState />;
  }

  // Broken streak
  if (currentStreak === 0) {
    return <StreakBrokenState longestStreak={longestStreak} lastActionDate={lastActionDate} />;
  }

  // Active streak
  return (
    <StreakActiveState
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      lastActionDate={lastActionDate}
    />
  );
}

// Re-export sub-states for testing convenience
export { StreakLoadingSkeleton, StreakEmptyState, StreakBrokenState, StreakActiveState };
