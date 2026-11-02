/**
 * Pomodoro state machine. Pure functions only (no storage, no DOM) so the
 * logic is easy to test. State is timestamp based, so it survives popup
 * closes, tab switches and service-worker restarts.
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  const MIN = 60 * 1000;

  const DEFAULT = Object.freeze({
    mode: 'classic', // 'classic' | 'deep' | 'custom'
    custom: { focus: 30, break: 10 },
    soundOn: true,
    phase: 'focus', // 'focus' | 'break'
    status: 'idle', // 'idle' | 'running' | 'paused'
    durationMs: 25 * MIN,
    endsAt: 0,
    remainingMs: 25 * MIN,
    runId: 0,
  });

  const clampInt = (value, [lo, hi], fallback) => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
  };

  function lengths(s) {
    const m = s.mode === 'custom' ? s.custom : FT.MODES[s.mode] || FT.MODES.classic;
    return { focus: m.focus * MIN, break: m.break * MIN };
  }

  const phaseMs = (s) => (s.phase === 'focus' ? lengths(s).focus : lengths(s).break);

  function remaining(s, now) {
    if (s.status === 'running') return Math.max(0, s.endsAt - now);
    if (s.status === 'paused') return s.remainingMs;
    return phaseMs(s);
  }

  const isDue = (s, now) => s.status === 'running' && now >= s.endsAt;
  const elapsedMs = (s, now) => (s.status === 'idle' ? 0 : Math.max(0, s.durationMs - remaining(s, now)));

  function start(s, now) {
    if (s.status === 'running') return s;
    const resuming = s.status === 'paused';
    const left = resuming ? s.remainingMs : phaseMs(s);
    return {
      ...s,
      status: 'running',
      durationMs: resuming ? s.durationMs : phaseMs(s),
      endsAt: now + left,
      remainingMs: left,
      runId: resuming ? s.runId : now,
    };
  }

  function pause(s, now) {
    if (s.status !== 'running') return s;
    return { ...s, status: 'paused', remainingMs: remaining(s, now), endsAt: 0 };
  }

  function idleAt(s, phase) {
    const next = { ...s, phase, status: 'idle', endsAt: 0 };
    next.durationMs = phaseMs(next);
    next.remainingMs = next.durationMs;
    return next;
  }

  /** Move to the other phase, idle and waiting for the user. */
  const next = (s) => idleAt(s, s.phase === 'focus' ? 'break' : 'focus');
  const reset = (s) => idleAt(s, 'focus');

  function setMode(s, mode) {
    if (s.status !== 'idle') return s;
    const valid = mode === 'custom' || Object.prototype.hasOwnProperty.call(FT.MODES, mode);
    return valid ? idleAt({ ...s, mode }, s.phase) : s;
  }

  function setCustom(s, focus, brk) {
    if (s.status !== 'idle') return s;
    const custom = {
      focus: clampInt(focus, FT.LIMITS.CUSTOM_FOCUS_MIN, s.custom.focus),
      break: clampInt(brk, FT.LIMITS.CUSTOM_BREAK_MIN, s.custom.break),
    };
    return idleAt({ ...s, mode: 'custom', custom }, s.phase);
  }

  FT.timer = { DEFAULT, phaseMs, remaining, isDue, elapsedMs, start, pause, next, reset, setMode, setCustom };
})(globalThis);
