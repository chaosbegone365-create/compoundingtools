/* Educational scenarios. No provider rates, recommendations, storage or network. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CYFCashGoals = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const rules = {
    expenses: ['Essential monthly expenses', 0, 1000000],
    reserveMonths: ['Chosen reserve months', 0, 60],
    cash: ['Current cash', 0, 100000000],
    goal: ['Goal cost', 0, 100000000],
    months: ['Months until goal', 0, 360, true],
    contribution: ['Monthly contribution', 0, 100000000],
    apy: ['Hypothetical cash APY', 0, 25],
    stressAmount: ['Separate hypothetical investment amount', 0, 100000000],
    downside: ['One-time investment decline', 0, 100]
  };
  function parse(raw) {
    const v = {};
    for (const [key, [name, min, max, integer]] of Object.entries(rules)) {
      const value = raw[key];
      if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim())) throw new Error(`Enter ${name.toLowerCase()}.`);
      const n = Number(value);
      if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) throw new Error(`${name} must be ${integer ? 'a whole number ' : ''}from ${min.toLocaleString('en-US')} to ${max.toLocaleString('en-US')}.`);
      v[key] = n;
    }
    return v;
  }
  function calculate(raw) {
    const v = parse(raw);
    const reserveTarget = v.expenses * v.reserveMonths;
    let reserve = Math.min(v.cash, reserveTarget);
    let goalBalance = Math.max(0, v.cash - reserveTarget);
    const startingGoalCash = goalBalance;
    const startingReserveGap = reserveTarget - reserve;
    const monthlyRate = Math.expm1(Math.log1p(v.apy / 100) / 12);
    let totalInterest = 0;
    const rows = [{ month: 0, reserveContribution: 0, goalContribution: 0, interest: 0, reserve, goalBalance }];
    for (let month = 1; month <= v.months; month++) {
      const interest = goalBalance * monthlyRate;
      const reserveContribution = Math.min(v.contribution, Math.max(0, reserveTarget - reserve));
      const goalContribution = v.contribution - reserveContribution;
      reserve += reserveContribution;
      goalBalance += interest + goalContribution;
      totalInterest += interest;
      rows.push({ month, reserveContribution, goalContribution, interest, reserve, goalBalance });
    }
    const reserveGap = Math.max(0, reserveTarget - reserve);
    const goalGap = Math.max(0, v.goal - goalBalance);
    const goalRemainder = Math.max(0, goalBalance - v.goal);
    const loss = v.stressAmount * (v.downside / 100);
    const stressValue = v.stressAmount - loss;
    const result = { inputs: v, reserveTarget, startingGoalCash, startingReserveGap, monthlyRate, reserve, reserveGap, goalBalance, goalGap, goalRemainder, totalGap: reserveGap + goalGap, totalInterest, contributions: v.contribution * v.months, loss, stressValue, rows };
    if (!Object.entries(result).filter(([, x]) => typeof x === 'number').every(([, x]) => Number.isFinite(x))) throw new Error('Amounts are too large to calculate. Enter smaller values.');
    return result;
  }
  function csv(r) {
    const lines = [['Cash reserve and goal scenario (hypothetical; USD)'], ['Assumption','Value']];
    for (const [key, [label]] of Object.entries(rules)) lines.push([label, r.inputs[key]]);
    lines.push(['Timing','Interest on opening goal balance; reserve top-up then goal contribution at month-end; no reserve interest'], ['Reserve target',r.reserveTarget], ['Starting reserve shortfall',r.startingReserveGap], ['Goal shortfall at deadline',r.goalGap], ['Reserve shortfall at deadline',r.reserveGap], ['Goal remainder after full goal cost',r.goalRemainder], ['Separate downside loss (not deducted from cash scenario)',r.loss], ['Separate stressed investment value',r.stressValue], [], ['Month','Reserve contribution USD','Goal contribution USD','Goal interest USD','Reserve balance USD','Goal balance before goal withdrawal USD']);
    for (const row of r.rows) lines.push([row.month,...['reserveContribution','goalContribution','interest','reserve','goalBalance'].map(k=>row[k].toFixed(2))]);
    return lines.map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  }
  return { calculate, csv, rules };
});
