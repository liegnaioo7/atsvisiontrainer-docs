/* Local substring search over MkDocs' index: supports Chinese without CDN/tokenizers. */
document.addEventListener('DOMContentLoaded', function () {
  // Match literal text and build DOM nodes so queries cannot inject markup.
  function matcher(query) {
    const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))].slice(0, 20);
    if (!terms.length) return null;
    return new RegExp(terms.sort((a, b) => b.length - a.length)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'giu');
  }
  function highlight(element, text, pattern) {
    element.replaceChildren();
    if (!pattern) { element.textContent = text; return; }
    pattern.lastIndex = 0;
    let offset = 0;
    for (const match of text.matchAll(pattern)) {
      element.append(document.createTextNode(text.slice(offset, match.index)));
      const mark = document.createElement('mark');
      mark.className = 'help-match'; mark.textContent = match[0]; element.append(mark);
      offset = match.index + match[0].length;
    }
    element.append(document.createTextNode(text.slice(offset)));
  }
  const pageQuery = (new URL(window.location.href).searchParams.get('highlight') || '').slice(0, 200);
  const pagePattern = matcher(pageQuery);
  const content = document.querySelector('[role="main"]');
  if (pagePattern && content) {
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.parentElement.closest('script, style, mark, .help-toolbar')
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      pagePattern.lastIndex = 0;
      if (!pagePattern.test(node.textContent)) continue;
      const span = document.createElement('span');
      highlight(span, node.textContent, pagePattern); node.replaceWith(span);
    }
    if (!window.location.hash) content.querySelector('mark.help-match')?.scrollIntoView({block: 'center'});
  }
  const input = document.getElementById('mkdocs-search-query');
  const results = document.getElementById('mkdocs-search-results');
  if (!input || !results) return;
  const messages = window.helpTranslations;
  results.setAttribute('aria-live', 'polite');
  const root = new URL((window.base_url || '.') + '/', window.location.href);
  let documents;
  const index = () => documents || (documents = fetch(new URL('search/search_index.json', root))
    .then(r => { if (!r.ok) throw new Error('index'); return r.json(); }).then(data => data.docs));
  let generation = 0;
  input.addEventListener('input', async function () {
    const current = ++generation;
    const query = input.value.trim().slice(0, 200).toLocaleLowerCase();
    results.replaceChildren();
    if (!query) return;
    try {
      const docs = await index();
      if (current !== generation) return;
      const terms = query.split(/\s+/);
      const pattern = matcher(query);
      const matches = docs.filter(d => terms.every(t => (d.title + ' ' + d.text).toLocaleLowerCase().includes(t))).slice(0, 40);
      const status = document.createElement('p');
      status.textContent = matches.length ? messages.found.replace('{0}', matches.length) : messages.not_found;
      results.replaceChildren(status);
      for (const doc of matches) {
        const url = new URL(doc.location, root);
        if (url.origin !== root.origin) continue;
        url.searchParams.set('highlight', query);
        const article = document.createElement('article');
        const link = document.createElement('a'); link.href = url.href; highlight(link, doc.title, pattern);
        const excerpt = document.createElement('p');
        const offset = Math.max(0, doc.text.toLocaleLowerCase().indexOf(terms[0]) - 45);
        highlight(excerpt, (offset ? '…' : '') + doc.text.slice(offset, offset + 190) + '…', pattern);
        article.append(link, excerpt); results.append(article);
      }
    } catch (_) {
      if (current === generation) { documents = null; results.textContent = messages.search_error; }
    }
  });
});
