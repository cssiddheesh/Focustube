/**
 * Features 6 and 9 on the watch page: per-video quick notes and a compact
 * timer control. Shown only while Focus Mode is on. Notes are stored locally
 * under "note:<videoId>" and auto-saved.
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  FT.ui = FT.ui || {};
  const { h } = FT.dom;

  const VIDEO_ID = /^[\w-]{6,20}$/;
  const noteKey = (id) => FT.KEYS.NOTE_PREFIX + id;

  let host, panel, textarea, statusEl, notesButton, timerEl, timerButton, noticeEl;
  let boundId = null;
  let dirty = false;
  let saveTimer = 0;
  let noticeTimer = 0;
  let chain = Promise.resolve();

  const setStatus = (text) => {
    statusEl.textContent = text;
  };

  async function load(id) {
    const key = noteKey(id);
    const stored = await FT.storage.get(key);
    const note = stored[key];
    textarea.value = note && typeof note.text === 'string' ? note.text : '';
    dirty = false;
    setStatus('');
  }

  async function flush() {
    clearTimeout(saveTimer);
    if (!dirty || !boundId) return;
    dirty = false;
    const key = noteKey(boundId);
    const text = textarea.value;
    try {
      if (text.trim() === '') await FT.storage.remove(key);
      else await FT.storage.set({ [key]: { text, updatedAt: Date.now() } });
      setStatus('Saved');
    } catch (error) {
      setStatus('Not saved');
    }
  }

  function onInput() {
    dirty = true;
    setStatus('Saving\u2026');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 500);
  }

  function insertTimestamp() {
    const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
    if (!video) return;
    const stamp = `[${FT.dates.formatTimestamp(video.currentTime)}] `;
    textarea.setRangeText(stamp, textarea.selectionStart, textarea.selectionEnd, 'end');
    textarea.focus();
    onInput();
  }

  function togglePanel(open) {
    panel.hidden = !open;
    notesButton.setAttribute('aria-expanded', String(open));
    if (open) textarea.focus();
    else flush();
  }

  /** Bind the dock to the current video (or hide it). Calls are serialised via `chain`. */
  async function sync() {
    const id = FT.router.videoId();
    const active = FT.focus.isEnabled() && FT.router.current() === 'watch' && id && VIDEO_ID.test(id);
    if (!active) {
      await flush();
      boundId = null;
      host.hidden = true;
      return;
    }
    host.hidden = false;
    if (id !== boundId) {
      await flush();
      boundId = id;
      await load(id);
    }
  }

  const queueSync = () => {
    chain = chain.then(sync).catch(() => {});
  };

  function showNotice(event) {
    let message = '';
    if (event.type === 'completed') message = event.phase === 'focus' ? 'Session complete. Take a break.' : 'Break over. Ready to focus?';
    else if (event.type === 'expired') message = 'The previous timer expired while the browser was closed.';
    if (!message) return;
    noticeEl.textContent = message;
    noticeEl.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      noticeEl.hidden = true;
    }, 8000);
  }

  function renderTimer({ state, remainingMs, event }) {
    timerEl.textContent = `${state.phase === 'focus' ? 'Focus' : 'Break'} ${FT.dates.formatClock(remainingMs)}`;
    timerButton.textContent = state.status === 'running' ? 'Pause' : state.status === 'paused' ? 'Resume' : 'Start';
    if (event) showNotice(event);
  }

  FT.ui.notesDock = {
    mount() {
      if (host) return;
      const parts = FT.dom.createHost('focustube-dock');
      host = parts.host;
      host.hidden = true;

      textarea = h('textarea', {
        placeholder: 'Write notes for this video\u2026',
        'aria-label': 'Notes for this video',
        maxlength: String(FT.LIMITS.NOTE_MAX_CHARS),
        spellcheck: 'true',
        oninput: onInput,
      });
      FT.dom.isolateKeys(textarea);
      statusEl = h('span', { class: 'ft-status', role: 'status' });
      noticeEl = h('div', { class: 'ft-notice', role: 'status', hidden: true });
      timerEl = h('span', { class: 'ft-timer' });
      timerButton = h('button', {
        class: 'ft-btn ft-primary',
        type: 'button',
        onclick: () => (FT.timerStore.getView().state.status === 'running' ? FT.timerStore.pause() : FT.timerStore.start()),
      });
      notesButton = h('button', {
        class: 'ft-btn',
        type: 'button',
        text: 'Notes',
        'aria-expanded': 'false',
        onclick: () => togglePanel(panel.hidden),
      });

      panel = h(
        'section',
        { class: 'ft-panel', hidden: true, 'aria-label': 'Video notes' },
        h(
          'header',
          { class: 'ft-panel-head' },
          h('span', { text: 'Notes' }),
          h('button', { class: 'ft-icon', type: 'button', 'aria-label': 'Close notes', text: '\u00D7', onclick: () => togglePanel(false) })
        ),
        textarea,
        h('footer', { class: 'ft-panel-foot' }, h('button', { class: 'ft-btn', type: 'button', text: '+ Timestamp', onclick: insertTimestamp }), statusEl)
      );

      parts.shadow.append(h('aside', { class: 'ft-dock' }, noticeEl, panel, h('div', { class: 'ft-bar' }, timerEl, timerButton, notesButton)));
      document.body.append(host);

      FT.timerStore.subscribe(renderTimer);
      renderTimer(FT.timerStore.getView());
      FT.focus.subscribe(queueSync);
      FT.router.subscribe(queueSync);
      window.addEventListener('pagehide', flush);
      queueSync();
    },
  };
})(globalThis);
