/* Decorative destination inspiration only; no flight data or click tracking. */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const board = document.querySelector('[data-destination-board]');
  if (!board) return;
  const nodes = Array.from(board.querySelectorAll('[data-dest]'));
  const toggle = board.querySelector('[data-board-toggle]');
  if (!nodes.length || !toggle) return;
  const cities = ['LISBON', 'SAN DIEGO', 'TOKYO', 'ROME', 'COSTA RICA', 'PARIS', 'KYOTO', 'QUEBEC CITY', 'BARCELONA', 'NEW YORK', 'LONDON', 'VANCOUVER'];
  const motion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let offset = 0;
  let userPaused = false;
  let interval = null;
  const pending = new Set();
  function stop() {
    if (interval !== null) window.clearInterval(interval);
    interval = null;
    pending.forEach(id => window.clearTimeout(id));
    pending.clear();
    nodes.forEach(node => node.classList.remove('flipping'));
  }
  function rotate() {
    offset = (offset + 1) % cities.length;
    nodes.forEach((node, i) => {
      node.classList.remove('flipping');
      void node.offsetWidth;
      node.classList.add('flipping');
      const id = window.setTimeout(() => {
        node.textContent = cities[(offset + i * 3) % cities.length];
        pending.delete(id);
      }, 210);
      pending.add(id);
    });
  }
  function sync() {
    stop();
    const reduced = !!(motion && motion.matches);
    toggle.hidden = false;
    toggle.disabled = reduced;
    toggle.textContent = reduced ? 'Animation off: reduced motion' : userPaused ? 'Resume destinations' : 'Pause destinations';
    if (!reduced && !userPaused && !document.hidden) interval = window.setInterval(rotate, 4200);
  }
  toggle.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  document.addEventListener('visibilitychange', sync);
  if (motion && typeof motion.addEventListener === 'function') motion.addEventListener('change', sync);
  else if (motion && typeof motion.addListener === 'function') motion.addListener(sync);
  sync();
})();
