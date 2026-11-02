/** Shared constants: storage keys, message types, limits and fallback data. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  FT.KEYS = Object.freeze({
    FOCUS: 'focusEnabled',
    TIMER: 'timer',
    DAILY: 'daily',
    TOTALS: 'totals',
    STREAK: 'streak',
    QUOTE: 'quoteCache',
    NOTE_PREFIX: 'note:',
    SETTINGS: 'settings',
    FONTS: 'fontCache',
  });

  FT.MSG = Object.freeze({
    GET_QUOTE: 'focustube/get-quote',
    TIMER: 'focustube/timer',
    VIDEO_COMPLETED: 'focustube/video-completed',
    GET_FONT: 'focustube/get-font',
  });

  FT.ATTR = Object.freeze({
    FOCUS: 'data-focustube',
    PAGE: 'data-focustube-page',
    OFF: 'data-focustube-off',
    HOME: 'data-focustube-home',
  });

  FT.MODES = Object.freeze({
    classic: { focus: 25, break: 5, label: 'Classic' },
    deep: { focus: 50, break: 10, label: 'Deep Study' },
  });

  FT.LIMITS = Object.freeze({
    CUSTOM_FOCUS_MIN: [1, 180],
    CUSTOM_BREAK_MIN: [1, 60],
    NOTE_MAX_CHARS: 20000,
    DAILY_HISTORY_DAYS: 400,
    PARTIAL_SESSION_MIN_SECONDS: 30,
    TIMER_STALE_MS: 10 * 60 * 1000,
  });

  FT.QUOTE = Object.freeze({
    API_URL: 'https://zenquotes.io/api/today',
    TTL_MS: 24 * 60 * 60 * 1000,
    RETRY_AFTER_MS: 10 * 60 * 1000,
    MAX_TEXT: 300,
    MAX_AUTHOR: 80,
  });

  FT.FALLBACK_QUOTES = Object.freeze([
    { text: 'Success is the sum of small efforts repeated daily.', author: 'Robert Collier' },
    { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
    { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
    { text: 'Well begun is half done.', author: 'Aristotle' },
    { text: 'Excellence is not an act, but a habit.', author: 'Will Durant' },
    { text: 'Concentrate all your thoughts upon the work at hand.', author: 'Alexander Graham Bell' },
    { text: 'Small deeds done are better than great deeds planned.', author: 'Peter Marshall' },
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  ]);
  /** Every feature the user can switch on or off (popup > Settings). CSS-driven ones are gated in focus.css. */
  FT.FEATURES = Object.freeze([
    { id: 'homefocus', group: 'Home & browsing', label: 'Focus homepage', desc: 'Replace the home feed with a search page' },
    { id: 'shorts', group: 'Home & browsing', label: 'Remove Shorts', desc: 'Hide Shorts and open them as normal videos' },
    { id: 'community', group: 'Home & browsing', label: 'Hide community & trending', desc: 'Community posts, Posts tab, Trending' },
    { id: 'related', group: 'Watch page', label: 'Hide recommended videos', desc: 'Related videos beside the player' },
    { id: 'comments', group: 'Watch page', label: 'Hide comments', desc: '' },
    { id: 'livechat', group: 'Watch page', label: 'Hide live chat', desc: 'Including chat replay' },
    { id: 'promos', group: 'Watch page', label: 'Hide merch & promotions', desc: 'Merch shelves, donation and promo banners' },
    { id: 'fullscreen', group: 'Watch page', label: 'Clean fullscreen', desc: 'End screens, suggested videos, pop-ups' },
    { id: 'quote', group: 'Study tools', label: 'Daily quote', desc: 'Shown on the focus homepage' },
    { id: 'timer', group: 'Study tools', label: 'Pomodoro timer', desc: 'Popup timer and the on-page timer chip' },
    { id: 'notes', group: 'Study tools', label: 'Quick notes', desc: 'Per-video notes on the watch page' },
    { id: 'stats', group: 'Study tools', label: 'Statistics & counters', desc: 'Study time, sessions, videos completed' },
    { id: 'streaks', group: 'Study tools', label: 'Study streaks', desc: '' },
  ]);

  /** Focus homepage customisation. First option of each list is not special; see `defaultValue`. */
  FT.HOME_OPTIONS = Object.freeze({
    choices: {
      theme: {
        label: 'Theme',
        defaultValue: 'midnight',
        options: [['midnight', 'Midnight Violet'], ['charcoal', 'Charcoal'], ['paper', 'Paper'], ['ocean', 'Ocean']],
      },
      brandFont: {
        label: 'Title font',
        defaultValue: 'redaction',
        options: [['redaction', 'Redaction 35'], ['audiowide', 'Audiowide'], ['serif', 'Young Serif']],
      },
      quoteSize: {
        label: 'Quote size',
        defaultValue: 'small',
        options: [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']],
      },
      quoteStyle: {
        label: 'Quote style',
        defaultValue: 'plain',
        options: [['card', 'Card'], ['plain', 'Plain text']],
      },
    },
    toggles: [
      { id: 'showTagline', label: 'Show tagline' },
      { id: 'showFooter', label: 'Show footer credit' },
    ],
  });

  /**
   * Fonts are fetched once by the background script from the Fontsource CDN
   * (all three are SIL Open Font License), cached in local storage and
   * registered with the FontFace API, so no request is made after the first run.
   */
  FT.FONTS = Object.freeze({
    redaction: { family: 'Redaction 35', url: 'https://cdn.jsdelivr.net/fontsource/fonts/redaction-35@5.3.0/latin-400-normal.woff2' },
    audiowide: { family: 'Audiowide', url: 'https://cdn.jsdelivr.net/fontsource/fonts/audiowide@latest/latin-400-normal.woff2' },
    youngSerif: { family: 'Young Serif', url: 'https://cdn.jsdelivr.net/fontsource/fonts/young-serif@latest/latin-400-normal.woff2' },
  });
})(globalThis);
