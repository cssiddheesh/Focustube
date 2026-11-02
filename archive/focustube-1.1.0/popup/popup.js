/** Popup: Focus toggle, Pomodoro timer controls, statistics. */
(function () {
  'use strict';
  const FT = globalThis.FocusTube;
  const $ = (id) => document.getElementById(id);
  const modeButtons = Array.from(document.querySelectorAll('[data-mode]'));
  let noticeTimer = 0;

  function renderFocus(enabled) {
    const button = $('focus-toggle');
    button.textContent = enabled ? 'Focused' : 'Focus';
    button.dataset.state = enabled ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(enabled));
  }

  function renderNotice(event) {
    let message = '';
    if (event.type === 'completed') message = event.phase === 'focus' ? 'Focus session complete. Time for a break.' : 'Break over. Ready when you are.';
    else if (event.type === 'expired') message = 'The previous timer expired while the browser was closed.';
    if (!message) return;
    const notice = $('notice');
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      notice.hidden = true;
    }, 8000);
  }

  function renderTimer({ state, remainingMs, event }) {
    const idle = state.status === 'idle';
    const total = idle ? FT.timer.phaseMs(state) : state.durationMs;
    const progress = idle ? 0 : Math.min(100, Math.max(0, (1 - remainingMs / total) * 100));

    $('time').textContent = FT.dates.formatClock(remainingMs);
    $('phase').textContent = state.phase === 'focus' ? 'Focus' : 'Break';
    $('bar-fill').style.width = `${progress}%`;
    $('btn-start').textContent = state.status === 'running' ? 'Pause' : state.status === 'paused' ? 'Resume' : 'Start';
    $('btn-reset').disabled = idle && state.phase === 'focus';
    $('sound').checked = state.soundOn;

    modeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
      button.disabled = !idle;
    });

    $('custom-row').hidden = state.mode !== 'custom';
    for (const [id, value] of [['custom-focus', state.custom.focus], ['custom-break', state.custom.break]]) {
      const input = $(id);
      input.disabled = !idle;
      if (document.activeElement !== input) input.value = value;
    }

    if (event) renderNotice(event);
  }

  async function renderStats() {
    const s = await FT.stats.getSummary();
    const days = (n) => `${n} ${n === 1 ? 'Day' : 'Days'}`;
    $('streak').textContent = `\uD83D\uDD25 ${days(s.currentStreak)} Streak`;
    $('stat-today').textContent = FT.dates.formatDuration(s.todaySeconds);
    $('stat-week').textContent = FT.dates.formatDuration(s.weekSeconds);
    $('stat-sessions-today').textContent = String(s.sessionsToday);
    $('stat-sessions-week').textContent = String(s.sessionsWeek);
    $('stat-sessions-month').textContent = String(s.sessionsMonth);
    $('stat-total').textContent = String(s.totalSessions);
    $('stat-videos').textContent = String(s.videosCompleted);
    $('stat-best').textContent = days(s.bestStreak);
  }

  async function init() {
    const K = FT.KEYS;
    const stored = await FT.storage.get(K.FOCUS);
    let focusOn = Boolean(stored[K.FOCUS]);
    renderFocus(focusOn);

    $('focus-toggle').addEventListener('click', async () => {
      focusOn = !focusOn;
      renderFocus(focusOn);
      await FT.storage.set({ [K.FOCUS]: focusOn });
    });

    FT.storage.onChanged((changes) => {
      if (changes[K.FOCUS]) {
        focusOn = Boolean(changes[K.FOCUS].newValue);
        renderFocus(focusOn);
      }
      if (changes[K.DAILY] || changes[K.TOTALS] || changes[K.STREAK]) renderStats();
    });

    await FT.timerStore.init();
    FT.timerStore.subscribe(renderTimer);
    renderTimer(FT.timerStore.getView());

    $('btn-start').addEventListener('click', () => (FT.timerStore.getView().state.status === 'running' ? FT.timerStore.pause() : FT.timerStore.start()));
    $('btn-reset').addEventListener('click', () => FT.timerStore.reset());
    $('btn-skip').addEventListener('click', () => FT.timerStore.skip());
    $('sound').addEventListener('change', (event) => FT.timerStore.setSound(event.target.checked));
    modeButtons.forEach((button) => button.addEventListener('click', () => FT.timerStore.setMode(button.dataset.mode)));
    ['custom-focus', 'custom-break'].forEach((id) =>
      $(id).addEventListener('change', () => FT.timerStore.setCustom(Number($('custom-focus').value), Number($('custom-break').value)))
    );

    renderStats();
  }

  init().catch((error) => console.error('[FocusTube]', error));
})();
