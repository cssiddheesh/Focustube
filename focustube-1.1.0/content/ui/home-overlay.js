/** Features 2 and 3: search-centric focus homepage with the daily quote. */
(function (root) {
  'use strict';
  const FT = (root.FocusTube = root.FocusTube || {});
  FT.ui = FT.ui || {};
  const { h } = FT.dom;

  let host = null;
  let input = null;
  let quoteText = null;
  let quoteAuthor = null;
  let quoteLoaded = false;
  let quoteLoading = false;
  let wasVisible = false;

  function submit(event) {
    event.preventDefault();
    const query = input.value.trim();
    if (query) location.assign(`/results?search_query=${encodeURIComponent(query)}`);
  }

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

  function update() {
    if (!host) return;
    const visible = FT.focus.isEnabled() && FT.router.current() === 'home';
    host.hidden = !visible;
    if (visible) {
      loadQuote();
      if (!wasVisible) requestAnimationFrame(() => input.focus());
    }
    wasVisible = visible;
  }

  FT.ui.homeOverlay = {
    mount() {
      if (host) return;
      const parts = FT.dom.createHost('focustube-home');
      host = parts.host;
      host.hidden = true;

      input = h('input', {
        type: 'search',
        placeholder: 'Search lectures, tutorials, courses\u2026',
        'aria-label': 'Search YouTube',
        autocomplete: 'off',
        spellcheck: 'false',
        maxlength: '200',
      });
      FT.dom.isolateKeys(input);
      quoteText = h('blockquote');
      quoteAuthor = h('figcaption');

      parts.shadow.append(
        h(
          'main',
          { class: 'ft-home' },
          h('h1', { class: 'ft-brand', text: 'FocusTube' }),
          h('p', { class: 'ft-tagline', text: 'Learn Without Distractions' }),
          h('figure', { class: 'ft-quote' }, quoteText, quoteAuthor),
          h('form', { class: 'ft-search', role: 'search', onsubmit: submit }, input, h('button', { type: 'submit', text: 'Search' })),
          h('p', { class: 'ft-attrib' }, 'Quotes by ', h('a', { href: 'https://zenquotes.io/', target: '_blank', rel: 'noopener noreferrer', text: 'ZenQuotes' }))
        )
      );

      document.body.append(host);
      FT.focus.subscribe(update);
      FT.router.subscribe(update);
      update();
    },
  };
})(globalThis);
