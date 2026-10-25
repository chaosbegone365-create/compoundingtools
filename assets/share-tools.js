/* Explicit-gesture sharing only; excludes query strings, fragments and all form state. */
(function (root) {
  'use strict';
  function canonicalURL(doc) {
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (!canonical) return null;
    try {
      const url = new URL(canonical.href);
      if (url.origin !== 'https://compoundyourfuture.com') return null;
      url.search = ''; url.hash = ''; return url.href;
    } catch (_) { return null; }
  }
  async function share(doc, nav, status, manual) {
    const url = canonicalURL(doc);
    manual.hidden = true;
    if (!url) { status.textContent = 'Sharing is unavailable: this page has no verified canonical link.'; return; }
    const data = { title: 'Compound Your Future', text: 'Explore free calculators from Compound Your Future.', url };
    if (typeof nav.share === 'function') {
      try { await nav.share(data); status.textContent = 'Share dialog completed.'; return; }
      catch (error) { if (error && error.name === 'AbortError') { status.textContent = 'Sharing canceled. Nothing was copied.'; return; } }
    }
    if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      try { await nav.clipboard.writeText(url); status.textContent = 'Page link copied. Your inputs and results are not included.'; return; } catch (_) {}
    }
    manual.value = url; manual.hidden = false; manual.focus(); manual.select();
    status.textContent = 'Copy this page link manually. Your inputs and results are not included.';
  }
  function init(doc, nav) {
    doc.querySelectorAll('[data-share-tool]').forEach(button => {
      const container = button.parentElement, status = container.querySelector('[data-share-status]'), manual = container.querySelector('[data-share-link]');
      if (!status || !manual) return;
      button.addEventListener('click', async () => { button.disabled = true; try { await share(doc, nav, status, manual); } finally { button.disabled = false; } });
    });
  }
  const api = { canonicalURL, share, init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CYFShare = api;
  if (typeof document !== 'undefined') init(document, navigator);
})(typeof globalThis !== 'undefined' ? globalThis : this);
