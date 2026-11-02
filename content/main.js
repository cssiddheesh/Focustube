/** Content script entry point: wires the modules together. */
(function (root) {
  'use strict';
  const FT = root.FocusTube;
  if (FT.booted) return; // guard against double injection
  FT.booted = true;

  /** Mirrors disabled features on <html> so focus.css can switch rules off. */
  function applySettings(settings) {
    document.documentElement.setAttribute(FT.ATTR.OFF, FT.settings.disabledList(settings));
  }

  /** Shorts are removed in Focus Mode: open them as a normal watch page instead. */
  function redirectShorts() {
    if (!FT.focus.isEnabled() || !FT.settings.current().features.shorts || FT.router.current() !== 'shorts') return;
    const id = FT.router.shortsId();
    if (/^[\w-]{11}$/.test(id)) location.replace(`/watch?v=${id}`);
  }

  async function boot() {
    applySettings(await FT.settings.init());
    FT.settings.subscribe(applySettings);
    await FT.focus.init(); // sets <html data-focustube> as early as possible
    FT.router.start();
    FT.focus.subscribe(redirectShorts);
    FT.router.subscribe(redirectShorts);
    FT.settings.subscribe(redirectShorts);
    redirectShorts();
    FT.videoTracker.start();

    await FT.timerStore.init();
    FT.dom.onBodyReady(() => {
      FT.ui.toggleButton.mount();
      FT.ui.homeOverlay.mount();
      FT.ui.notesDock.mount();
      FT.fonts.load(['redaction', 'audiowide', 'youngSerif']);
    });
  }

  boot().catch((error) => console.error('[FocusTube]', error));
})(globalThis);
