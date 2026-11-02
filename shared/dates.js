/** Date and formatting helpers. All day keys use the user's local calendar. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  const pad = (n) => String(n).padStart(2, '0');

  function dayKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(key, amount) {
    const date = parseKey(key);
    date.setDate(date.getDate() + amount);
    return dayKey(date);
  }

  /** Monday of the week containing `date`. */
  function weekStartKey(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dayKey(d);
  }

  function monthPrefix(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  }

  /** 12315 seconds -> "3h 25m"; 540 seconds -> "9m". */
  function formatDuration(seconds) {
    const totalMinutes = Math.max(0, Math.floor(seconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  /** Countdown display, "mm:ss". */
  function formatClock(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
  }

  /** Video timestamp, "m:ss" or "h:mm:ss". */
  function formatTimestamp(seconds) {
    const t = Math.max(0, Math.floor(seconds));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  FT.dates = { dayKey, parseKey, addDays, weekStartKey, monthPrefix, formatDuration, formatClock, formatTimestamp };
})(globalThis);
