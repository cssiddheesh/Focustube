/** Content script entry point: wires the modules together. */
(function (root) {
  'use strict';
  const FT = root.FocusTube;
  if (FT.booted) return; // guard against double injection
  FT.booted = true;

  /** Shorts are removed in Focus Mode: open them as a normal watch page instead. */
  function redirectShorts() {
    if (!FT.focus.isEnabled() || FT.router.current() !== 'shorts') return;
    const id = FT.router.shortsId();
    if (/^[\w-]{11}$/.test(id)) location.replace(`/watch?v=${id}`);
  }

  async function boot() {
    await FT.focus.init(); // sets <html data-focustube> as early as possible
    FT.router.start();
    FT.focus.subscribe(redirectShorts);
    FT.router.subscribe(redirectShorts);
    redirectShorts();
    FT.videoTracker.start();

    await FT.timerStore.init();
    FT.dom.onBodyReady(() => {
      FT.ui.toggleButton.mount();
      FT.ui.homeOverlay.mount();
      FT.ui.notesDock.mount();
    });
  }

  boot().catch((error) => console.error('[FocusTube]', error));
})(globalThis);
