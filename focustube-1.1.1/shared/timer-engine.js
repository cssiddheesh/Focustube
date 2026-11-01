/**
 * Timer engine. Runs in the background script only: it is the single writer
 * of timer + stats state, and a promise queue serialises every action, so
 * several tabs and the popup can never double-count a session.
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  let queue = Promise.resolve();
  const enqueue = (task) => {
    const run = queue.then(task);
    queue = run.catch(() => {});
    return run;
  };

  async function readState() {
    const stored = await FT.storage.get(FT.KEYS.TIMER);
    return { ...FT.timer.DEFAULT, ...stored[FT.KEYS.TIMER] };
  }

  /** Bank time from a focus phase that is being abandoned. */
  async function bankPartial(state, now) {
    if (state.phase === 'focus' && state.status !== 'idle' && (await FT.settings.get()).features.stats) {
      await FT.stats.recordPartial(FT.timer.elapsedMs(state, now) / 1000);
    }
  }

  const actions = {
    start: (s, now) => ({ state: FT.timer.start(s, now) }),
    pause: (s, now) => ({ state: FT.timer.pause(s, now) }),
    async reset(s, now) {
      await bankPartial(s, now);
      return { state: FT.timer.reset(s) };
    },
    async skip(s, now) {
      await bankPartial(s, now);
      return { state: FT.timer.next(s) };
    },
    setMode: (s, now, p) => ({ state: FT.timer.setMode(s, p && p.mode) }),
    setCustom: (s, now, p) => ({ state: FT.timer.setCustom(s, p && p.focus, p && p.break) }),
    setSound: (s, now, p) => ({ state: { ...s, soundOn: Boolean(p && p.soundOn) } }),

    async completeIfDue(s, now) {
      if (!FT.timer.isDue(s, now)) return null;
      // Browser was closed for a long time: do not award credit for the gap.
      if (now - s.endsAt > FT.LIMITS.TIMER_STALE_MS) {
        return { state: FT.timer.reset(s), event: { type: 'expired' } };
      }
      if (s.phase === 'focus') {
        const { features } = await FT.settings.get();
        if (features.stats) await FT.stats.recordFocusSession(s.durationMs / 1000, { streak: features.streaks });
      }
      return { state: FT.timer.next(s), event: { type: 'completed', phase: s.phase, soundOn: s.soundOn } };
    },
  };

  function apply(action, payload) {
    return enqueue(async () => {
      if (!Object.prototype.hasOwnProperty.call(actions, action)) throw new Error(`Unknown timer action: ${action}`);
      const state = await readState();
      const out = await actions[action](state, Date.now(), payload);
      if (!out) return { state, event: null };
      await FT.storage.set({ [FT.KEYS.TIMER]: out.state });
      return { state: out.state, event: out.event || null };
    });
  }

  FT.timerEngine = { apply };
})(globalThis);
