/**
 * Background script (Chromium: service worker, Firefox: event page).
 * Responsibilities:
 *  - fetch and cache the daily quote (content scripts cannot call the API because of CORS)
 *  - fetch each UI font once and cache it locally (see shared/fonts.js)
 *  - own all timer and statistics writes (single writer, serialised)
 *  - inject the content script into already-open YouTube tabs on first install
 */
'use strict';

// Chromium service workers load dependencies with importScripts().
// Firefox loads the same files through "background.scripts" (see scripts/build.mjs).
if (typeof importScripts === 'function' && !globalThis.FocusTube) {
  importScripts(
    '../shared/browser-api.js',
    '../shared/constants.js',
    '../shared/dates.js',
    '../shared/storage.js',
    '../shared/settings.js',
    '../shared/quotes.js',
    '../shared/stats.js',
    '../shared/timer.js',
    '../shared/timer-engine.js'
  );
}

(function (root) {
  const FT = root.FocusTube;
  const api = FT.api;
  let quoteRetryAt = 0;

  async function getQuote() {
    const now = Date.now();
    const stored = await FT.storage.get(FT.KEYS.QUOTE);
    const cached = stored[FT.KEYS.QUOTE];
    const hasCache = Boolean(cached) && typeof cached.text === 'string';

    if (hasCache && now - cached.fetchedAt < FT.QUOTE.TTL_MS) {
      return { text: cached.text, author: cached.author || '' };
    }

    if (now >= quoteRetryAt) {
      try {
        const response = await fetch(FT.QUOTE.API_URL, {
          cache: 'no-store',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const quote = FT.quotes.sanitizeQuote(await response.json());
        if (!quote) throw new Error('Unusable quote payload');
        await FT.storage.set({ [FT.KEYS.QUOTE]: { ...quote, fetchedAt: now } });
        return quote;
      } catch (error) {
        quoteRetryAt = now + FT.QUOTE.RETRY_AFTER_MS;
      }
    }

    if (hasCache) return { text: cached.text, author: cached.author || '' };
    return FT.quotes.fallbackQuote(FT.dates.dayKey());
  }

  // Font downloads are queued so concurrent requests cannot overwrite each other's cache entry.
  let fontQueue = Promise.resolve();

  async function fetchFont(id) {
    if (!Object.prototype.hasOwnProperty.call(FT.FONTS, id)) throw new Error('Unknown font');
    const stored = await FT.storage.get(FT.KEYS.FONTS);
    const cache = stored[FT.KEYS.FONTS] || {};
    if (typeof cache[id] === 'string') return { data: cache[id] };

    const response = await fetch(FT.FONTS[id].url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const isWoff2 = bytes.length > 1000 && bytes.length < 400000 && String.fromCharCode(...bytes.subarray(0, 4)) === 'wOF2';
    if (!isWoff2) throw new Error('Unexpected font data');

    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const data = btoa(binary);
    await FT.storage.set({ [FT.KEYS.FONTS]: { ...cache, [id]: data } });
    return { data };
  }

  function getFont(id) {
    const run = fontQueue.then(() => fetchFont(id));
    fontQueue = run.catch(() => {});
    return run;
  }

  /** Makes FocusTube work immediately in tabs that were open before installation. */
  async function injectIntoOpenTabs() {
    const [script] = api.runtime.getManifest().content_scripts || [];
    if (!script) return;
    const tabs = await api.tabs.query({ url: script.matches });
    for (const tab of tabs) {
      try {
        if (script.css) await api.scripting.insertCSS({ target: { tabId: tab.id }, files: script.css });
        await api.scripting.executeScript({ target: { tabId: tab.id }, files: script.js });
      } catch (error) {
        /* Tab may be discarded or restricted; it will pick the script up on next load. */
      }
    }
  }

  api.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') injectIntoOpenTabs();
  });

  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender.id !== api.runtime.id || !message || typeof message.type !== 'string') return false;

    const respond = (promise) => {
      promise.then(sendResponse, (error) => sendResponse({ error: String((error && error.message) || error) }));
      return true; // keep the channel open for the async response
    };

    switch (message.type) {
      case FT.MSG.GET_QUOTE:
        return respond(getQuote());
      case FT.MSG.TIMER:
        return respond(FT.timerEngine.apply(message.action, message.payload));
      case FT.MSG.GET_FONT:
        return respond(getFont(message.id));
      case FT.MSG.VIDEO_COMPLETED:
        return respond(
          FT.settings
            .get()
            .then((settings) => (settings.features.stats ? FT.stats.recordVideoCompleted() : null))
            .then(() => ({ ok: true }))
        );
      default:
        return false;
    }
  });
})(globalThis);
