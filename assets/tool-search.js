/* Static, local-only search. No queries or calculator values leave the browser. */
(function (root) {
  'use strict';
  const catalog = [
    ["school-costs", "Public vs private school costs", "Family", "family-school-costs.html", "Compare tuition, care and transport across school years using your own quotes.", "school education k12 public private tuition aftercare summer sibling children"],
    ["college-paths", "College pathway cost comparison", "Family", "family-college-paths.html", "Compare two-year, four-year and transfer scenarios using your own quotes and aid assumptions.", "college university education tuition public private in-state out-of-state two-year four-year 2+2 transfer scholarship grants"],
    ["cash-goals", "Cash reserve and savings goal calculator", "Retirement", "money-cash-goals.html", "Model your chosen reserve and savings deadline with hypothetical APY, not an allocation recommendation.", "cash emergency fund reserve savings high yield savings HYSA brokerage savings vs investing APY goal deadline cash allocation"],

    ['growth', 'Compound growth calculator', 'Money', '#growth', 'Explore investment growth with regular contributions.', 'compound interest investing investment brokerage stocks millionaire future value'],
    ['retirement', 'Retirement savings calculator', 'Retirement', '#retirement', 'Estimate the savings needed for your retirement goal.', 'retire pension ira 401k nest egg financial independence'],
    ['bonus', 'Bonus calculator', 'Career', '#bonus', 'Estimate gross bonus compensation before taxes.', 'salary compensation incentive payout annual bonus'],
    ['options', 'Options profit calculator', 'Money', 'options.html', 'Model call and put outcomes at expiration, including risk and breakeven.', 'options investing option trading calls puts profit loss strike premium'],
    ['comparison', 'Investment performance comparison', 'Money', 'compare-performance.html', 'Explore the comparison tool and its data availability limitations.', 'benchmark beat the market portfolio performance etf returns'],
    ['raise', 'Pay raise calculator', 'Career', 'career-raise.html', 'Compare a raise with inflation and changes in pay.', 'salary wage income job pay rise inflation'],
    ['childcare', 'Childcare cost calculator', 'Family', 'family-childcare.html', 'Compare childcare costs and household budget choices.', 'daycare nursery preschool child children care babysitter'],
    ['one-income', 'One-income household calculator', 'Family', 'family-one-income.html', 'Explore how moving to one income changes your household budget.', 'stay at home parent family work childcare career break'],
    ['travel-budget', 'Vacation budget calculator', 'Travel', 'travel-budget.html', 'Estimate trip costs and explore destinations.', 'travel holiday vacation flight hotel trip map destination'],
    ['travel-savings', 'Travel savings calculator', 'Travel', 'travel-savings.html', 'Plan monthly savings toward a trip.', 'travel vacation holiday sinking fund trip save'],
    ['fitness', 'Fitness cost comparison', 'Health', 'health-fitness.html', 'Compare gym, home workouts, and fitness classes.', 'gym exercise membership classes home fitness workout cost'],
    ['workout', 'Weekly workout planner', 'Health', 'health-workout.html', 'Build a practical weekly exercise schedule.', 'exercise fitness workout routine training schedule strength cardio'],
    ['meals', 'Meal planner and grocery budget', 'Health', 'health-meal-planner.html', 'Plan meals, ingredient quantities, and grocery spending.', 'food grocery groceries meal cooking recipes shopping nutrition'],
    ['mortgage', 'All-in mortgage calculator', 'Home', 'home-mortgage.html', 'Estimate housing payments including taxes, insurance, and other costs.', 'house home loan mortgage payment buy property pmi hoa'],
    ['home-savings', 'Home savings calculator', 'Home', 'home-savings.html', 'Plan savings toward a home purchase.', 'down payment deposit house buy home savings'],
    ['renovation', 'Home renovation budget', 'Home', 'home-renovation.html', 'Plan a renovation with contingencies and project costs.', 'remodel renovation kitchen bathroom repair contractor improvement']
  ].map(([id, name, category, href, description, keywords]) => ({ id, name, category, href, description, keywords }));
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const stop = new Set(['a','an','the','for','of','to','my','i','want','need','how','do','can','and','with','calculator','tool']);
  function search(query, items = catalog) {
    const q = normalize(query), tokens = q.split(' ').filter(t => t && !stop.has(t));
    if (!tokens.length) return items.slice();
    return items.map((item, order) => {
      const name = normalize(item.name), keywords = normalize(item.keywords), category = normalize(item.category);
      const fields = [name, keywords, category, normalize(item.description)];
      // Match whole words/prefixes, never arbitrary substrings ("put" must not match "input").
      const tokenScores = tokens.map(token => Math.max(...fields.map((field, i) => field.split(' ').some(word => word === token || (token.length >= 3 && word.startsWith(token))) ? [12,9,6,3][i] : 0)));
      const matched = tokenScores.filter(Boolean).length;
      if (!matched) return null;
      const score = tokenScores.reduce((a,b) => a+b, 0) + (matched === tokens.length ? 40 : 0) + (name.includes(q) ? 30 : 0) + (keywords.includes(q) ? 20 : 0);
      return { item, score, order };
    }).filter(Boolean).sort((a,b) => b.score-a.score || a.order-b.order).map(row => row.item);
  }
  function init(doc) {
    const form = doc.getElementById('tool-search-form'), input = doc.getElementById('site-search'), panel = doc.getElementById('tool-search-panel'), list = doc.getElementById('tool-search-results'), status = doc.getElementById('tool-search-status');
    if (!form || !input || !panel || !list || !status) return;
    let links = [], active = -1;
    function close() { panel.hidden = true; input.setAttribute('aria-expanded','false'); active = -1; }
    function render() {
      const results = search(input.value); active = -1; list.replaceChildren();
      results.forEach(item => {
        const li = doc.createElement('li'), link = doc.createElement('a'), title = doc.createElement('strong'), detail = doc.createElement('span');
        link.href = item.href; title.textContent = item.name; detail.textContent = item.category + ' · ' + item.description;
        link.append(title, detail); li.append(link); list.append(li);
      });
      links = Array.from(list.querySelectorAll('a'));
      status.textContent = results.length ? (normalize(input.value) ? results.length + ' matching tools. Choose a result.' : 'Browse all ' + results.length + ' tools, or type a goal.') : 'No matching tools yet. Try a broader goal, or suggest a tool below.';
      panel.hidden = false; input.setAttribute('aria-expanded','true');
    }
    form.addEventListener('submit', event => { event.preventDefault(); render(); if (links.length) { active = 0; links[0].focus(); } });
    input.addEventListener('input', render);
    input.addEventListener('focus', () => { if (input.value.trim()) render(); });
    form.parentElement.addEventListener('keydown', event => {
      if (event.key === 'Escape') { close(); input.focus(); close(); return; }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (event.target !== input && !list.contains(event.target)) return;
      event.preventDefault(); if (panel.hidden) render(); if (!links.length) return;
      active = links.indexOf(doc.activeElement);
      active = event.key === 'ArrowDown' ? (active + 1) % links.length : (active <= 0 ? links.length - 1 : active - 1);
      links[active].focus();
    });
    doc.addEventListener('click', event => { if (!form.parentElement.contains(event.target)) close(); });
  }
  const api = { catalog, normalize, search, init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CYFToolSearch = api;
  if (typeof document !== 'undefined') init(document);
})(typeof globalThis !== 'undefined' ? globalThis : this);
