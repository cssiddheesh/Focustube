/**
 * Background script (Chromium: service worker, Firefox: event page).
 * Responsibilities:
 *  - fetch and cache the daily quote (content scripts cannot call the API because of CORS)
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
      case FT.MSG.VIDEO_COMPLETED:
        return respond(FT.stats.recordVideoCompleted().then(() => ({ ok: true })));
      default:
        return false;
    }
  });
})(globalThis);
