/** Counts finished videos for the "Videos Completed" statistic (Focus Mode only, once per video per page load). */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  FT.videoTracker = {
    start() {
      const counted = new Set();
      // Media events do not bubble, so listen in the capture phase.
      document.addEventListener(
        'ended',
        (event) => {
          const video = event.target;
          if (!video || video.tagName !== 'VIDEO') return;
          if (!FT.focus.isEnabled() || FT.router.current() !== 'watch' || !FT.settings.current().features.stats) return;
          if (document.querySelector('.html5-video-player.ad-showing')) return;
          const id = FT.router.videoId();
          if (!id || counted.has(id)) return;
          counted.add(id);
          try {
            const pending = FT.api.runtime.sendMessage({ type: FT.MSG.VIDEO_COMPLETED });
            if (pending && pending.catch) pending.catch(() => {});
          } catch (error) {
            /* extension context invalidated */
          }
        },
        true
      );
    },
  };
})(globalThis);
