/** Popup: Focus toggle, Pomodoro timer, statistics and Settings (feature switches + homepage look). */
(function () {
  'use strict';
  const FT = globalThis.FocusTube;
  const { h } = FT;
  const $ = (id) => document.getElementById(id);
  const modeButtons = Array.from(document.querySelectorAll('[data-mode]'));
  let noticeTimer = 0;

  /* ---------- Focus toggle ---------- */
  function renderFocus(enabled) {
    const button = $('focus-toggle');
    button.textContent = enabled ? 'Focused' : 'Focus';
    button.dataset.state = enabled ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(enabled));
  }

  /* ---------- Tabs ---------- */
  function selectTab(name) {
    for (const tab of ['study', 'settings']) {
      $(`tab-${tab}`).setAttribute('aria-selected', String(tab === name));
      $(`panel-${tab}`).hidden = tab !== name;
    }
  }

  /* ---------- Timer ---------- */
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

  /* ---------- Statistics ---------- */
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

  /* ---------- Settings ---------- */
  function buildSettings() {
    const list = $('feature-list');
    let group = null;
    for (const feature of FT.FEATURES) {
      if (feature.group !== group) {
        group = feature.group;
        list.append(h('h3', { class: 'group', text: group }));
      }
      const input = h('input', { type: 'checkbox', id: `feature-${feature.id}`, role: 'switch', 'data-feature': feature.id });
      input.addEventListener('change', () => FT.settings.update({ features: { [feature.id]: input.checked } }));
      list.append(
        h(
          'label',
          { class: 'row', for: input.id },
          h('span', { class: 'row-text' }, h('span', { class: 'row-title', text: feature.label }), feature.desc ? h('small', { text: feature.desc }) : null),
          input
        )
      );
    }

    const options = $('home-options');
    for (const [key, option] of Object.entries(FT.HOME_OPTIONS.choices)) {
      const select = h('select', { id: `home-${key}`, 'data-home': key }, option.options.map(([value, label]) => h('option', { value, text: label })));
      select.addEventListener('change', () => FT.settings.update({ home: { [key]: select.value } }));
      options.append(h('label', { class: 'row', for: select.id }, h('span', { class: 'row-title', text: option.label }), select));
    }
    for (const toggle of FT.HOME_OPTIONS.toggles) {
      const input = h('input', { type: 'checkbox', id: `home-${toggle.id}`, role: 'switch', 'data-home': toggle.id });
      input.addEventListener('change', () => FT.settings.update({ home: { [toggle.id]: input.checked } }));
      options.append(h('label', { class: 'row', for: input.id }, h('span', { class: 'row-title', text: toggle.label }), input));
    }

    $('reset-settings').addEventListener('click', () => FT.settings.reset());
  }

  function renderSettings(settings) {
    document.querySelectorAll('[data-feature]').forEach((input) => {
      input.checked = settings.features[input.dataset.feature];
    });
    document.querySelectorAll('[data-home]').forEach((control) => {
      const value = settings.home[control.dataset.home];
      if (control.type === 'checkbox') control.checked = value;
      else control.value = value;
    });

    // Hide the parts of the Study tab that are switched off.
    const { timer, stats, streaks } = settings.features;
    $('card-timer').hidden = !timer;
    $('card-stats').hidden = !stats;
    $('streak').hidden = !streaks;
    $('best-wrap').hidden = !streaks;
    $('study-empty').hidden = timer || stats;
  }

  /* ---------- Init ---------- */
  async function init() {
    const K = FT.KEYS;
    buildSettings();
    renderSettings(await FT.settings.init());
    FT.settings.subscribe(renderSettings);

    const stored = await FT.storage.get(K.FOCUS);
    let focusOn = Boolean(stored[K.FOCUS]);
    renderFocus(focusOn);

    $('focus-toggle').addEventListener('click', async () => {
      focusOn = !focusOn;
      renderFocus(focusOn);
      await FT.storage.set({ [K.FOCUS]: focusOn });
    });
    $('tab-study').addEventListener('click', () => selectTab('study'));
    $('tab-settings').addEventListener('click', () => selectTab('settings'));

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
    FT.fonts.load(['audiowide', 'youngSerif']);
  }

  init().catch((error) => console.error('[FocusTube]', error));
})();
