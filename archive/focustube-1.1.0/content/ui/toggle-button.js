/** Feature 1: Focus toggle button placed in YouTube's top bar. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  FT.ui = FT.ui || {};

  let host = null;
  let button = null;

  function render(enabled) {
    if (!button) return;
    button.textContent = enabled ? 'Focused' : 'Focus';
    button.dataset.state = enabled ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(enabled));
  }

  /** YouTube re-renders its masthead occasionally, so re-attach when needed. */
  function attach() {
    const end = document.querySelector('ytd-masthead #end');
    if (end && host && host.parentElement !== end) end.prepend(host);
  }

  FT.ui.toggleButton = {
    mount() {
      if (host) return;
      const parts = FT.dom.createHost('focustube-toggle');
      host = parts.host;
      button = FT.dom.h('button', { class: 'ft-toggle', type: 'button', onclick: () => FT.focus.toggle() });
      parts.shadow.append(button);
      render(FT.focus.isEnabled());
      FT.focus.subscribe(render);
      FT.router.subscribe(attach);
      attach();
      setInterval(attach, 1500);
    },
  };
})(globalThis);
