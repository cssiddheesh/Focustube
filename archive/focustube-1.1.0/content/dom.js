/** DOM helpers. FocusTube never uses innerHTML: nodes are built with createElement/textContent only. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  /**
   * Tiny element factory. `text` sets textContent, `on<event>` attaches a
   * listener, `class` sets className, everything else becomes an attribute.
   */
  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : String(value));
    }
    for (const child of children.flat()) {
      if (child !== undefined && child !== null) node.append(child);
    }
    return node;
  }

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
