/** Short three-note chime generated with Web Audio (no audio assets needed). */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  function chime() {
    try {
      const Ctx = root.AudioContext || root.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const start = ctx.currentTime;
      [[660, 0], [880, 0.22], [1320, 0.44]].forEach(([frequency, offset]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start + offset);
        osc.stop(start + offset + 0.45);
      });
      setTimeout(() => ctx.close(), 1500);
    } catch (error) {
      /* Audio can be blocked by autoplay policy; the visual notice still shows. */
    }
  }

  FT.sound = { chime };
})(globalThis);
