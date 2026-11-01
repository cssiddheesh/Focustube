/**
 * SPA navigation. YouTube swaps pages without reloading, so we listen for its
 * navigation events and keep a cheap URL poll as a safety net.
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  const listeners = new Set();
  let lastHref = '';

  function current() {
    const path = location.pathname;
    if (path === '/' || path === '') return 'home';
    if (path === '/watch') return 'watch';
    if (path.startsWith('/shorts/')) return 'shorts';
    if (path === '/results') return 'search';
    return 'other';
  }

  function check(force) {
    if (!force && location.href === lastHref) return;
    lastHref = location.href;
    const page = current();
    document.documentElement.setAttribute(FT.ATTR.PAGE, page);
    listeners.forEach((listener) => listener(page));
  }

  FT.router = {
    current,
    videoId: () => new URLSearchParams(location.search).get('v'),
    shortsId: () => (location.pathname.split('/')[2] || '').trim(),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      ['yt-navigate-finish', 'yt-page-data-updated'].forEach((type) => document.addEventListener(type, () => check(false), true));
      window.addEventListener('popstate', () => check(false));
      setInterval(() => check(false), 1000);
      check(true);
    },
  };
})(globalThis);
