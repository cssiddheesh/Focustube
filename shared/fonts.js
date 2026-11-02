/**
 * Loads the bundled-on-first-run fonts (see FT.FONTS). The font bytes come from
 * storage (or the background script on the first run) and are registered with
 * the FontFace API, which page content-security-policies do not restrict.
 * If anything fails the CSS fallback stacks (Georgia / Segoe UI) are used.
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  const loaded = new Set();

  function decode(base64) {
    return Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  }

  async function loadOne(id) {
    const def = Object.prototype.hasOwnProperty.call(FT.FONTS, id) ? FT.FONTS[id] : null;
    if (!def || loaded.has(id)) return;
    loaded.add(id);
    try {
      const stored = await FT.storage.get(FT.KEYS.FONTS);
      let data = (stored[FT.KEYS.FONTS] || {})[id];
      if (typeof data !== 'string') {
        const response = await FT.api.runtime.sendMessage({ type: FT.MSG.GET_FONT, id });
        data = response && response.data;
      }
      if (typeof data !== 'string') throw new Error('No font data');
      const face = new FontFace(def.family, decode(data).buffer, { weight: '400', style: 'normal', display: 'swap' });
      await face.load();
      document.fonts.add(face);
    } catch (error) {
      loaded.delete(id); // allow a retry on the next call
    }
  }

  FT.fonts = { load: (ids) => Promise.allSettled(ids.map(loadOne)) };
})(globalThis);
