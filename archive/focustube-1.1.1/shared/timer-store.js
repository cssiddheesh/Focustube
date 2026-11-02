/**
 * Client-side timer mirror used by the content script and the popup.
 * It mirrors storage, ticks once a second for display, and sends every
 * change to the background script (the single writer).
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  let state = null;
  let tickId = 0;
  let completing = false;
  const listeners = new Set();

  function view(event) {
    return { state, remainingMs: FT.timer.remaining(state, Date.now()), event: event || null };
  }

  function emit(event) {
    if (!state) return;
    const snapshot = view(event);
    listeners.forEach((listener) => listener(snapshot));
  }

  async function dispatch(action, payload) {
    try {
      const response = await FT.api.runtime.sendMessage({ type: FT.MSG.TIMER, action, payload });
      if (!response || response.error) return null;
      state = response.state;
      if (response.event && response.event.type === 'completed' && response.event.soundOn) FT.sound.chime();
      emit(response.event);
      return response;
    } catch (error) {
      return null; // e.g. extension was reloaded while the page stayed open
    }
  }

  async function tick() {
    if (!state || state.status !== 'running') return;
    if (!FT.timer.isDue(state, Date.now())) return emit();
    if (completing) return;
    completing = true;
    try {
      await dispatch('completeIfDue');
    } finally {
      completing = false;
    }
  }

  async function init() {
    if (state) return;
    const stored = await FT.storage.get(FT.KEYS.TIMER);
    state = { ...FT.timer.DEFAULT, ...stored[FT.KEYS.TIMER] };
    FT.storage.onChanged((changes) => {
      if (!changes[FT.KEYS.TIMER]) return;
      state = { ...FT.timer.DEFAULT, ...changes[FT.KEYS.TIMER].newValue };
      emit();
    });
    tickId = setInterval(tick, 1000);
    tick();
  }

  FT.timerStore = {
    init,
    getView: () => view(),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start: () => dispatch('start'),
    pause: () => dispatch('pause'),
    reset: () => dispatch('reset'),
    skip: () => dispatch('skip'),
    setMode: (mode) => dispatch('setMode', { mode }),
    setCustom: (focus, brk) => dispatch('setCustom', { focus, break: brk }),
    setSound: (soundOn) => dispatch('setSound', { soundOn }),
  };
})(globalThis);
