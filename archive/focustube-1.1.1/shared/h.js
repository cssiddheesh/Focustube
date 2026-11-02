/**
 * Tiny element factory used by the content script and the popup.
 * FocusTube never uses innerHTML: nodes are built with createElement/textContent only.
 * `text` sets textContent, `on<event>` attaches a listener, `class` sets className,
 * everything else becomes an attribute.
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});

  FT.h = function h(tag, attrs, ...children) {
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
  };
})(globalThis);
