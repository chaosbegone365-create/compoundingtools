(function () {
  'use strict';
  const model = window.CYFCashGoals;
  const form = document.getElementById('cash-goal-form');
  const status = document.getElementById('cash-status');
  const results = document.getElementById('cash-results');
  const body = document.getElementById('cash-rows');
  const exportButton = document.getElementById('cash-export');
  const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  let current = null;
  function render() {
    try {
      const raw = Object.fromEntries(Object.keys(model.rules).map(k=>[k,form.elements.namedItem(k).value]));
      current = model.calculate(raw);
      const r = current;
      status.className = '';
      status.textContent = `Updated: month ${r.inputs.months}. Goal cash ${money(r.goalBalance)}; goal shortfall ${money(r.goalGap)}; reserve shortfall ${money(r.reserveGap)}.`;
      results.hidden = false;
      exportButton.disabled = false;
      document.getElementById('goal-balance').textContent = money(r.goalBalance);
      const breakdown = document.getElementById('cash-breakdown');
      breakdown.replaceChildren();
      const lines = [['Chosen reserve target',r.reserveTarget],['Cash initially available for goal',r.startingGoalCash],['Reserve shortfall today',r.startingReserveGap],['Total future contributions',r.contributions],['Modeled goal interest',r.totalInterest],['Reserve held at deadline',r.reserve],['Reserve shortfall at deadline',r.reserveGap],['Goal shortfall at deadline',r.goalGap],['Goal remainder after full goal cost',r.goalRemainder]];
      for (const [label,value] of lines) {
        const dt=document.createElement('dt'), dd=document.createElement('dd');
        dt.textContent=label; dd.textContent=money(value); breakdown.append(dt,dd);
      }
      document.getElementById('cash-interpretation').textContent = r.totalGap > 0.005
        ? `These assumptions leave a combined gap of ${money(r.totalGap)} across the chosen reserve and goal. The reserve is not spent to make the goal appear funded. Try a different deadline, contribution or goal cost; this is not an account recommendation.`
        : `Under these assumptions, the chosen reserve and goal are both covered, with ${money(r.goalRemainder)} left in the goal pot after the goal is paid. That remainder is not a recommendation to invest it.`;
      document.getElementById('cash-stress').textContent = r.inputs.stressAmount === 0 ? 'Skipped: hypothetical investment amount is $0.00.' : `An independent ${money(r.inputs.stressAmount)} investment with a one-time ${r.inputs.downside}% decline loses ${money(r.loss)}, leaving ${money(r.stressValue)}. This is not deducted from or added to your cash plan.`;
      body.replaceChildren();
      const fragment = document.createDocumentFragment();
      for (const row of r.rows) {
        const tr=document.createElement('tr');
        ['month','reserveContribution','goalContribution','interest','reserve','goalBalance'].forEach((key,i)=>{
          const cell=document.createElement(i===0?'th':'td');
          if (i===0) cell.scope='row';
          cell.textContent=i===0?String(row[key]):money(row[key]); tr.append(cell);
        });
        fragment.append(tr);
      }
      body.append(fragment);
    } catch (error) {
      current = null; results.hidden = true; exportButton.disabled = true; body.replaceChildren();
      status.className = 'error'; status.textContent = error.message;
    }
  }
  form.addEventListener('input',render);
  form.addEventListener('submit',event=>{event.preventDefault();render();});
  form.addEventListener('reset',()=>{setTimeout(render,0);});
  exportButton.addEventListener('click',()=>{
    if (!current) return;
    const url = URL.createObjectURL(new Blob([model.csv(current)],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a'); link.href=url; link.download='cash-reserve-goal-scenario.csv';
    document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  render();
})();
