/** Quote sanitising and offline fallback. Output is plain text and must only be rendered via textContent. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  const TAGS = /<[^>]*>/g;
  const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;

  function clean(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value.replace(TAGS, '').replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  /** Validates a ZenQuotes payload ([{ q, a }]). Returns { text, author } or null. */
  function sanitizeQuote(payload) {
    const item = Array.isArray(payload) ? payload[0] : null;
    if (!item || typeof item !== 'object') return null;
    const text = clean(item.q, FT.QUOTE.MAX_TEXT);
    const author = clean(item.a, FT.QUOTE.MAX_AUTHOR);
    // ZenQuotes answers rate-limit errors with a normal-looking 200 response.
    if (!text || /^too many requests/i.test(text) || author.toLowerCase() === 'zenquotes.io') return null;
    return { text, author };
  }

  /** Deterministic per-day pick so the fallback quote is stable within a day. */
  function fallbackQuote(dayKey) {
    let hash = 0;
    for (const ch of dayKey) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return FT.FALLBACK_QUOTES[hash % FT.FALLBACK_QUOTES.length];
  }

  FT.quotes = { sanitizeQuote, fallbackQuote };
})(globalThis);
