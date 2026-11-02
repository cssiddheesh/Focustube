/** Thin wrapper around chrome.storage.local / browser.storage.local. Local only, never synced. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  const area = () => FT.api.storage.local;

  FT.storage = {
    get(keys) {
      return area().get(keys);
    },
    set(items) {
      return area().set(items);
    },
    remove(keys) {
      return area().remove(keys);
    },
    /** Subscribe to local-area changes. Returns an unsubscribe function. */
    onChanged(listener) {
      const handler = (changes, areaName) => {
        if (areaName === 'local') listener(changes);
      };
      FT.api.storage.onChanged.addListener(handler);
      return () => FT.api.storage.onChanged.removeListener(handler);
    },
  };
})(globalThis);
