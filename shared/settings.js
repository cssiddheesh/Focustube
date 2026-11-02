/** User settings: feature switches + homepage look. Validated on every read so bad data can never break the UI. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  const K = FT.KEYS;

  const isObject = (v) => v !== null && typeof v === 'object';

  /** Fills gaps with defaults and drops anything invalid. Pure function. */
  function normalize(stored) {
    const s = isObject(stored) ? stored : {};
    const sf = isObject(s.features) ? s.features : {};
    const sh = isObject(s.home) ? s.home : {};
    const features = {};
    for (const f of FT.FEATURES) features[f.id] = typeof sf[f.id] === 'boolean' ? sf[f.id] : true;
    const home = {};
    for (const [key, opt] of Object.entries(FT.HOME_OPTIONS.choices)) {
      home[key] = opt.options.some(([value]) => value === sh[key]) ? sh[key] : opt.defaultValue;
    }
    for (const { id } of FT.HOME_OPTIONS.toggles) home[id] = typeof sh[id] === 'boolean' ? sh[id] : true;
    return { features, home };
  }

  /** Space-separated ids of disabled features, mirrored on <html> for the CSS rules. */
  const disabledList = (settings) =>
    Object.entries(settings.features)
      .filter(([, enabled]) => !enabled)
      .map(([id]) => id)
      .join(' ');

  let cache = normalize(null);
  let watching = false;
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener(cache));

  async function get() {
    const stored = await FT.storage.get(K.SETTINGS);
    return normalize(stored[K.SETTINGS]);
  }

  async function update(patch) {
    const current = await get();
    const next = normalize({
      features: { ...current.features, ...(patch.features || {}) },
      home: { ...current.home, ...(patch.home || {}) },
    });
    await FT.storage.set({ [K.SETTINGS]: next });
    cache = next;
    notify();
    return next;
  }

  async function reset() {
    await FT.storage.remove(K.SETTINGS);
    cache = normalize(null);
    notify();
    return cache;
  }

  /** Loads settings and keeps them in sync with storage (other tabs, popup). Call once. */
  async function init() {
    if (watching) return cache;
    watching = true;
    cache = await get();
    FT.storage.onChanged((changes) => {
      if (!changes[K.SETTINGS]) return;
      cache = normalize(changes[K.SETTINGS].newValue);
      notify();
    });
    return cache;
  }

  FT.settings = {
    normalize,
    disabledList,
    get,
    update,
    reset,
    init,
    current: () => cache,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
})(globalThis);
