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
  });

  FT.MSG = Object.freeze({
    GET_QUOTE: 'focustube/get-quote',
    TIMER: 'focustube/timer',
    VIDEO_COMPLETED: 'focustube/video-completed',
  });

  FT.ATTR = Object.freeze({
    FOCUS: 'data-focustube',
    PAGE: 'data-focustube-page',
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
})(globalThis);
