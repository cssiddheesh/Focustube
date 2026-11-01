/**
 * Study statistics, streaks and counters.
 * Writers run in the background script only (single writer, so no races).
 * Readers (popup) call getSummary().
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  const K = FT.KEYS;

  const emptyDay = () => ({ seconds: 0, sessions: 0, videos: 0 });

  async function load() {
    const data = await FT.storage.get([K.DAILY, K.TOTALS, K.STREAK]);
    return {
      daily: data[K.DAILY] || {},
      totals: { sessions: 0, videos: 0, ...data[K.TOTALS] },
      streak: { current: 0, best: 0, lastDate: null, ...data[K.STREAK] },
    };
  }

  function prune(daily) {
    const keys = Object.keys(daily).sort();
    const excess = keys.length - FT.LIMITS.DAILY_HISTORY_DAYS;
    for (let i = 0; i < excess; i += 1) delete daily[keys[i]];
  }

  async function save({ daily, totals, streak }) {
    prune(daily);
    await FT.storage.set({ [K.DAILY]: daily, [K.TOTALS]: totals, [K.STREAK]: streak });
  }

  function bucket(daily, key) {
    daily[key] = { ...emptyDay(), ...daily[key] };
    return daily[key];
  }

  function advanceStreak(streak, today) {
    if (streak.lastDate === today) return;
    streak.current = streak.lastDate === FT.dates.addDays(today, -1) ? streak.current + 1 : 1;
    streak.lastDate = today;
    streak.best = Math.max(streak.best, streak.current);
  }

  /** A completed focus session: counts time, the session and the streak. */
  async function recordFocusSession(seconds) {
    const data = await load();
    const today = FT.dates.dayKey();
    const day = bucket(data.daily, today);
    day.seconds += Math.max(0, Math.round(seconds));
    day.sessions += 1;
    data.totals.sessions += 1;
    advanceStreak(data.streak, today);
    await save(data);
  }

  /** Time studied in a session that was stopped early. Adds time only. */
  async function recordPartial(seconds) {
    if (!(seconds >= FT.LIMITS.PARTIAL_SESSION_MIN_SECONDS)) return;
    const data = await load();
    bucket(data.daily, FT.dates.dayKey()).seconds += Math.round(seconds);
    await save(data);
  }

  async function recordVideoCompleted() {
    const data = await load();
    bucket(data.daily, FT.dates.dayKey()).videos += 1;
    data.totals.videos += 1;
    await save(data);
  }

  async function getSummary(now = new Date()) {
    const { daily, totals, streak } = await load();
    const today = FT.dates.dayKey(now);
    const weekStart = FT.dates.weekStartKey(now);
    const month = FT.dates.monthPrefix(now);
    const out = { todaySeconds: 0, weekSeconds: 0, sessionsToday: 0, sessionsWeek: 0, sessionsMonth: 0 };

    for (const [key, value] of Object.entries(daily)) {
      const day = { ...emptyDay(), ...value };
      if (key === today) {
        out.todaySeconds += day.seconds;
        out.sessionsToday += day.sessions;
      }
      if (key >= weekStart && key <= today) {
        out.weekSeconds += day.seconds;
        out.sessionsWeek += day.sessions;
      }
      if (key.startsWith(month)) out.sessionsMonth += day.sessions;
    }

    const streakAlive = streak.lastDate === today || streak.lastDate === FT.dates.addDays(today, -1);
    return {
      ...out,
      totalSessions: totals.sessions,
      videosCompleted: totals.videos,
      currentStreak: streakAlive ? streak.current : 0,
      bestStreak: streak.best,
      lastDate: streak.lastDate,
    };
  }

  FT.stats = { recordFocusSession, recordPartial, recordVideoCompleted, getSummary };
})(globalThis);
