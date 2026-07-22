import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { formatQuantity } from '../utils/format';

function progressKey(recipeId) {
  return `home-recipes-progress-${recipeId}`;
}

function legacyProgressKey(recipeId) {
  return `reseptikoti-progress-${recipeId}`;
}

let sharedAudioContext = null;

function getAudioContext() {
  if (sharedAudioContext) return sharedAudioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  sharedAudioContext = new AudioContextClass();
  return sharedAudioContext;
}

async function prepareAudio() {
  const context = getAudioContext();
  if (context?.state === 'suspended') {
    try { await context.resume(); } catch { /* The visual alert remains available. */ }
  }
  return context;
}

async function playTimerAlarm() {
  const context = await prepareAudio();
  if (context) {
    const start = context.currentTime + 0.03;
    const ringGroups = 5;
    const strikesPerGroup = 6;

    // Repeated high/low bell strikes create a longer, traditional kitchen-timer ring.
    for (let group = 0; group < ringGroups; group += 1) {
      const groupStart = start + group * 1.45;

      for (let strike = 0; strike < strikesPerGroup; strike += 1) {
        const toneStart = groupStart + strike * 0.16;
        const baseFrequency = strike % 2 === 0 ? 1450 : 1180;

        [1, 2.03].forEach((harmonic, harmonicIndex) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const peakVolume = harmonicIndex === 0 ? 0.18 : 0.055;

          oscillator.type = harmonicIndex === 0 ? 'triangle' : 'sine';
          oscillator.frequency.setValueAtTime(baseFrequency * harmonic, toneStart);
          oscillator.frequency.exponentialRampToValueAtTime(
            baseFrequency * harmonic * 0.985,
            toneStart + 0.13,
          );

          gain.gain.setValueAtTime(0.0001, toneStart);
          gain.gain.exponentialRampToValueAtTime(peakVolume, toneStart + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + 0.14);

          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(toneStart);
          oscillator.stop(toneStart + 0.15);
        });
      }
    }
  }

  if (navigator.vibrate) {
    navigator.vibrate([
      450, 120, 450, 120, 450, 350,
      450, 120, 450, 120, 450, 350,
      450, 120, 450,
    ]);
  }
}

function timerInitialState(steps) {
  return (steps || []).reduce((result, step) => {
    const durationSeconds = Math.max(0, Number(step.timerMinutes || 0) * 60);
    result[step.id] = {
      durationSeconds,
      remainingSeconds: durationSeconds,
      running: false,
      endAt: null,
      finished: false,
    };
    return result;
  }, {});
}

function formatTimer(secondsValue) {
  const seconds = Math.max(0, Number(secondsValue) || 0);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function CookingMode({ recipe, scale, onClose }) {
  const steps = recipe.steps || [];
  const [completed, setCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem(progressKey(recipe.id)) || localStorage.getItem(legacyProgressKey(recipe.id)) || '{}';
      return JSON.parse(saved).steps || {};
    } catch {
      return {};
    }
  });
  const [timers, setTimers] = useState(() => timerInitialState(steps));
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;
  const runningCount = useMemo(() => Object.values(timers).filter((timer) => timer.running).length, [timers]);

  useEffect(() => {
    try {
      localStorage.setItem(progressKey(recipe.id), JSON.stringify({ steps: completed }));
    } catch {
      // Cooking remains usable when storage is unavailable or full.
    }
  }, [completed, recipe.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimers((current) => {
        const now = Date.now();
        let changed = false;
        let shouldAlarm = false;
        const next = { ...current };

        Object.keys(next).forEach((stepId) => {
          const timer = next[stepId];
          if (!timer?.running || !timer.endAt) return;
          const remainingSeconds = Math.max(0, Math.ceil((timer.endAt - now) / 1000));
          if (remainingSeconds !== timer.remainingSeconds) changed = true;
          if (remainingSeconds === 0) {
            shouldAlarm = !timer.finished;
            next[stepId] = { ...timer, remainingSeconds: 0, running: false, endAt: null, finished: true };
          } else {
            next[stepId] = { ...timer, remainingSeconds };
          }
        });

        if (shouldAlarm) window.setTimeout(playTimerAlarm, 0);
        return changed ? next : current;
      });
    }, 500);
    return () => window.clearInterval(interval);
  }, []);

  function toggleStep(stepId) {
    setCompleted((current) => ({ ...current, [stepId]: !current[stepId] }));
  }

  async function startTimer(step) {
    await prepareAudio();
    setTimers((current) => {
      const timer = current[step.id];
      const durationSeconds = timer?.durationSeconds || Math.max(0, Number(step.timerMinutes || 0) * 60);
      const remainingSeconds = timer?.remainingSeconds > 0 ? timer.remainingSeconds : durationSeconds;
      return {
        ...current,
        [step.id]: {
          ...timer,
          durationSeconds,
          remainingSeconds,
          running: true,
          endAt: Date.now() + remainingSeconds * 1000,
          finished: false,
        },
      };
    });
  }

  function pauseTimer(stepId) {
    setTimers((current) => {
      const timer = current[stepId];
      if (!timer?.running) return current;
      return {
        ...current,
        [stepId]: {
          ...timer,
          remainingSeconds: Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)),
          running: false,
          endAt: null,
        },
      };
    });
  }

  function resetTimer(step) {
    const durationSeconds = Math.max(0, Number(step.timerMinutes || 0) * 60);
    setTimers((current) => ({
      ...current,
      [step.id]: { durationSeconds, remainingSeconds: durationSeconds, running: false, endAt: null, finished: false },
    }));
  }

  function addMinute(stepId) {
    setTimers((current) => {
      const timer = current[stepId];
      const remainingSeconds = (timer?.remainingSeconds || 0) + 60;
      return {
        ...current,
        [stepId]: {
          ...timer,
          durationSeconds: Math.max(timer?.durationSeconds || 0, remainingSeconds),
          remainingSeconds,
          endAt: timer?.running ? Date.now() + remainingSeconds * 1000 : null,
          finished: false,
        },
      };
    });
  }

  return (
    <div className="cooking-mode">
      <header className="cooking-header">
        <button className="button button-ghost-light" type="button" onClick={onClose}><Icon name="back" size={18} /> Recipe</button>
        <div className="cooking-title"><small>Cooking now</small><strong>{recipe.title}</strong></div>
        <div className="cooking-header-actions">
          <button className="timer-sound-test" type="button" onClick={playTimerAlarm}>Test sound</button>
          <div className="cooking-progress-label">{completedCount}/{steps.length} done{runningCount ? ` · ${runningCount} timer${runningCount === 1 ? '' : 's'}` : ''}</div>
        </div>
      </header>
      <div className="cooking-progress-track"><span style={{ width: `${progress}%` }} /></div>

      <div className="cooking-layout cooking-list-layout">
        <aside className="cooking-sidebar">
          <h2>Ingredients</h2>
          <div className="cooking-ingredients">
            {(recipe.ingredients || []).map((ingredient) => (
              <div key={ingredient.id}>
                <strong>{formatQuantity(Number(ingredient.quantity || 0) * scale)} {ingredient.unit}</strong>
                <span>{ingredient.name}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="cooking-all-steps">
          <div className="cooking-method-heading">
            <div><span className="eyebrow">Full method</span><h1>Cook at your own pace</h1></div>
            <p>Every step stays visible, so you can prepare upcoming tasks while a timer is running.</p>
          </div>

          <div className="cooking-step-cards">
            {steps.map((step, index) => {
              const timer = timers[step.id] || {};
              const isComplete = Boolean(completed[step.id]);
              return (
                <article className={`cooking-step-card ${isComplete ? 'is-complete' : ''} ${timer.finished ? 'timer-finished' : ''}`} key={step.id}>
                  <button className="cooking-step-check" type="button" onClick={() => toggleStep(step.id)} aria-label={isComplete ? `Mark step ${index + 1} incomplete` : `Mark step ${index + 1} complete`}>
                    <span>{isComplete ? <Icon name="check" size={20} /> : index + 1}</span>
                  </button>
                  <div className="cooking-step-content">
                    <div className="cooking-step-title-row">
                      <div><small>Step {index + 1}</small><h2>{step.title}</h2></div>
                      {isComplete ? <span className="completed-label"><Icon name="check" size={15} /> Complete</span> : null}
                    </div>
                    <p>{step.text}</p>

                    {Number(step.timerMinutes || 0) > 0 ? (
                      <div className={`inline-step-timer ${timer.running ? 'is-running' : ''} ${timer.finished ? 'is-finished' : ''}`}>
                        <div className="inline-timer-display">
                          <Icon name="clock" size={21} />
                          <span>{timer.finished ? "Time's up!" : formatTimer(timer.remainingSeconds)}</span>
                          <small>{timer.running ? 'Running' : timer.finished ? 'Timer alert' : `${step.timerMinutes} min timer`}</small>
                        </div>
                        <div className="inline-timer-actions">
                          {timer.running
                            ? <button className="button button-secondary" type="button" onClick={() => pauseTimer(step.id)}>Pause</button>
                            : <button className="button button-primary" type="button" onClick={() => startTimer(step)}>{timer.remainingSeconds && timer.remainingSeconds < timer.durationSeconds ? 'Resume' : timer.finished ? 'Start again' : 'Start timer'}</button>}
                          <button className="button button-secondary timer-small-button" type="button" onClick={() => addMinute(step.id)}>+1 min</button>
                          <button className="text-button" type="button" onClick={() => resetTimer(step)}>Reset</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
