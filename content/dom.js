/** Content-script DOM helpers (element factory lives in shared/h.js). */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  const { h } = FT;

  /** Host element with an open shadow root that loads FocusTube's stylesheets. */
  function createHost(id) {
    const host = document.createElement('div');
    host.id = id;
    const shadow = host.attachShadow({ mode: 'open' });
    for (const path of ['shared/tokens.css', 'content/styles/components.css']) {
      shadow.append(h('link', { rel: 'stylesheet', href: FT.api.runtime.getURL(path) }));
    }
    return { host, shadow };
  }

  /**
   * Inside a shadow root YouTube sees the host as the event target, so its
   * single-key shortcuts (k, f, m, ...) would fire while typing.
   * Stop key events at the field so typing never controls the video.
   */
  function isolateKeys(element) {
    ['keydown', 'keyup', 'keypress'].forEach((type) => element.addEventListener(type, (event) => event.stopPropagation()));
  }

  function onBodyReady(callback) {
    if (document.body) callback();
    else document.addEventListener('DOMContentLoaded', callback, { once: true });
  }

  FT.dom = { h, createHost, isolateKeys, onBodyReady };
})(globalThis);
