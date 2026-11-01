# Fonts

The PRD specifies two Google Fonts (both SIL Open Font License, free to bundle):

| Font        | Use                         | Expected file                  |
| ----------- | --------------------------- | ------------------------------ |
| Audiowide   | Buttons, menus, dashboard   | `Audiowide-Regular.woff2`      |
| Young Serif | Quotes, welcome message     | `YoungSerif-Regular.woff2`     |

Download them from https://fonts.google.com, convert to `.woff2` if needed,
and place them in this folder. Until then the extension falls back to
`Segoe UI` and `Georgia` (see `shared/tokens.css`).

Fonts are bundled rather than loaded from Google Fonts on purpose:
FocusTube must make no third-party requests other than the quote API.
