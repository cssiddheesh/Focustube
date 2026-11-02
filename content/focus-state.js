/** Focus Mode state: persisted locally, mirrored on <html>, synced across tabs. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  let enabled = false;
  const listeners = new Set();

  function apply() {
    document.documentElement.setAttribute(FT.ATTR.FOCUS, enabled ? 'on' : 'off');
    listeners.forEach((listener) => listener(enabled));
  }

  FT.focus = {
    isEnabled: () => enabled,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async init() {
      const stored = await FT.storage.get(FT.KEYS.FOCUS);
      enabled = Boolean(stored[FT.KEYS.FOCUS]);
      apply();
      FT.storage.onChanged((changes) => {
        const change = changes[FT.KEYS.FOCUS];
        if (change && Boolean(change.newValue) !== enabled) {
          enabled = Boolean(change.newValue);
          apply();
        }
      });
    },

    /** Applies immediately (instant switching), then persists. */
    async set(value) {
      enabled = Boolean(value);
      apply();
      await FT.storage.set({ [FT.KEYS.FOCUS]: enabled });
    },

    toggle() {
      return this.set(!enabled);
    },
  };
})(globalThis);
