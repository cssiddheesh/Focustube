/**
 * Features 2 and 3: the focus homepage (title, daily quote, footer credit).
 * YouTube's own search bar is moved into the middle of this page with CSS:
 * we reserve a slot, publish its position as CSS variables, and focus.css
 * pins the masthead search box to it. No YouTube DOM is moved or rebuilt.
 */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  FT.ui = FT.ui || {};
  const { h } = FT.dom;

  const SEARCH_INPUTS = ['ytd-masthead input#search', 'ytd-masthead input[name="search_query"]', 'ytd-masthead input.ytSearchboxComponentInput'];
  const VARS = ['top', 'left', 'width'];

  let host, main, slot, tagline, quoteFigure, quoteText, quoteAuthor, footer;
  let quoteLoaded = false;
  let quoteLoading = false;
  let wasVisible = false;

  function showQuote(quote) {
    // textContent only: quotes are never injected as HTML.
    quoteText.textContent = `\u201C${quote.text}\u201D`;
    quoteAuthor.textContent = quote.author ? `\u2014 ${quote.author}` : '';
  }

  async function loadQuote() {
    if (quoteLoaded || quoteLoading) return;
    quoteLoading = true;
    try {
      const quote = await FT.api.runtime.sendMessage({ type: FT.MSG.GET_QUOTE });
      if (!quote || typeof quote.text !== 'string') throw new Error('No quote');
      showQuote({ text: quote.text, author: typeof quote.author === 'string' ? quote.author : '' });
    } catch (error) {
      showQuote(FT.quotes.fallbackQuote(FT.dates.dayKey()));
    } finally {
      quoteLoaded = true;
      quoteLoading = false;
    }
  }

  function positionSearch() {
    const rootEl = document.documentElement;
    if (!host || host.hidden) {
      VARS.forEach((name) => rootEl.style.removeProperty(`--ft-search-${name}`));
      return;
    }
    const rect = slot.getBoundingClientRect();
    rootEl.style.setProperty('--ft-search-top', `${Math.round(rect.top)}px`);
    rootEl.style.setProperty('--ft-search-left', `${Math.round(rect.left)}px`);
    rootEl.style.setProperty('--ft-search-width', `${Math.round(rect.width)}px`);
  }

  function focusSearch() {
    for (const selector of SEARCH_INPUTS) {
      const input = document.querySelector(selector);
      if (input) {
        input.focus({ preventScroll: true });
        return;
      }
    }
  }

  function applySettings(settings) {
    host.dataset.theme = settings.home.theme;
    host.dataset.font = settings.home.brandFont;
    host.dataset.qsize = settings.home.quoteSize;
    host.dataset.qstyle = settings.home.quoteStyle;
    tagline.hidden = !settings.home.showTagline;
    quoteFigure.hidden = !settings.features.quote;
    footer.hidden = !settings.home.showFooter;
  }

  function update() {
    if (!host) return;
    const settings = FT.settings.current();
    applySettings(settings);

    const visible = FT.focus.isEnabled() && FT.router.current() === 'home' && settings.features.homefocus;
    host.hidden = !visible;
    const rootEl = document.documentElement;
    if (visible) {
      rootEl.setAttribute(FT.ATTR.HOME, 'active');
      if (settings.features.quote) loadQuote();
      requestAnimationFrame(positionSearch);
      if (!wasVisible) setTimeout(focusSearch, 250);
    } else {
      rootEl.removeAttribute(FT.ATTR.HOME);
      positionSearch();
    }
    wasVisible = visible;
  }

  FT.ui.homeOverlay = {
    mount() {
      if (host) return;
      const parts = FT.dom.createHost('focustube-home');
      host = parts.host;
      host.hidden = true;

      tagline = h('p', { class: 'ft-tagline', text: 'Learn Without Distractions' });
      quoteText = h('blockquote');
      quoteAuthor = h('figcaption');
      quoteFigure = h('figure', { class: 'ft-quote' }, quoteText, quoteAuthor);
      slot = h('div', { class: 'ft-search-slot', 'aria-hidden': 'true' });
      main = h('main', { class: 'ft-home' }, h('h1', { class: 'ft-brand', text: 'FocusTube' }), tagline, quoteFigure, slot);
      footer = h(
        'footer',
        { class: 'ft-footer' },
        'Developed with ',
        h('span', { role: 'img', 'aria-label': 'love', text: '\uD83D\uDC96' }),
        ' by ',
        h('a', { href: 'https://cssiddheesh.in/bio', target: '_blank', rel: 'noopener noreferrer', text: 'CS SIDDHEESH' })
      );

      parts.shadow.append(main, footer);
      document.body.append(host);

      // Keep YouTube's search bar glued to the slot when layout changes.
      const observer = new ResizeObserver(positionSearch);
      observer.observe(main);
      observer.observe(host);
      window.addEventListener('resize', positionSearch);
      host.addEventListener('scroll', positionSearch);

      FT.focus.subscribe(update);
      FT.router.subscribe(update);
      FT.settings.subscribe(update);
      update();
    },
  };
})(globalThis);
