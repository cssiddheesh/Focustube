/**
 * Cross-browser extension API handle.
 * Firefox exposes promise-based `browser.*`; Chromium browsers (Chrome, Edge,
 * Brave, Opera) expose `chrome.*`, which is promise-based in Manifest V3.
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  FT.api = root.browser ?? root.chrome;
})(globalThis);
