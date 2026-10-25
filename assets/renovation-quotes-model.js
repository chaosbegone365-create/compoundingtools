/* User-entered quote arithmetic and user-assigned preference fit only. No product database. */
(function(root){
'use strict';
const limits={budget:[0,100000000,2],otherCosts:[0,1000000,2],contingency:[0,100,2],quantity:[0,100000,2],unitPrice:[0,1000000,2],labor:[0,1000000,2],removal:[0,1000000,2],extras:[0,1000000,2],tax:[0,1000000,2],aesthetics:[0,10,0],durability:[0,10,0],maintenance:[0,10,0]};
const attributes=['aesthetics','durability','maintenance'];
const quoteKeys=['name','unit','quantity','unitPrice','labor','removal','extras','tax',...attributes];
function parse(value,key){
 if(key==='name'||key==='unit'){
  if(typeof value!=='string'||!value.trim()||/[\u0000-\u001f\u007f]/.test(value)||value.trim().length>(key==='name'?80:30))throw new Error('Enter a one-line '+(key==='name'?'label of 1–80':'unit of 1–30')+' characters.');
  return value.trim();
 }
 const rule=limits[key];if(!rule)throw new Error('Unknown field.');
 if(typeof value!=='number'&&typeof value!=='string')throw new Error('Enter a number.');
 const s=String(value).trim();if(!/^\d+(?:\.\d+)?$/.test(s))throw new Error('Enter a nonnegative number without symbols or exponents.');
 const n=Number(s);if(!Number.isFinite(n)||n<rule[0]||n>rule[1])throw new Error('Enter a value from '+rule[0]+' to '+rule[1]+'.');
 if(rule[2]===0){if(s.includes('.')&&!/^0+$/.test(s.split('.')[1]))throw new Error('Enter a whole-number score from 0 to 10.');}
 else if(s.includes('.')&&s.split('.')[1].length>rule[2])throw new Error('Use at most two decimal places.');
 return n;
}
const cents=n=>Math.round(n*100);
// Integer half-up rounding. BigInt keeps the product exact even at supported limits.
function roundRatio(a,b,denominator){return Number((BigInt(a)*BigInt(b)+BigInt(denominator/2))/BigInt(denominator));}
function sharedInput(input){
 const weights=Object.fromEntries(attributes.map(k=>[k,parse(input.weights[k],k)]));
 return {budget:cents(parse(input.budget,'budget')),otherCosts:cents(parse(input.otherCosts,'otherCosts')),contingencyBP:cents(parse(input.contingency,'contingency')),weights,weightTotal:attributes.reduce((sum,k)=>sum+weights[k],0)};
}
function calculateValidated(shared,quote,index){
 const q=Object.fromEntries(quoteKeys.map(k=>[k,parse(quote[k],k)]));
 const material=roundRatio(cents(q.quantity),cents(q.unitPrice),100);
 const labor=cents(q.labor),removal=cents(q.removal),extras=cents(q.extras),tax=cents(q.tax);
 const quoteSubtotal=material+labor+removal+extras+tax,base=quoteSubtotal+shared.otherCosts;
 const contingency=roundRatio(base,shared.contingencyBP,10000),total=base+contingency;
 const numerator=attributes.reduce((sum,k)=>sum+q[k]*shared.weights[k],0);
 return {index,name:q.name,unit:q.unit,quantity:q.quantity,unitPrice:cents(q.unitPrice),scores:Object.fromEntries(attributes.map(k=>[k,q[k]])),material,labor,removal,extras,tax,quoteSubtotal,otherCosts:shared.otherCosts,base,contingency,total,headroom:shared.budget-total,affordable:total<=shared.budget,numerator,score:shared.weightTotal?numerator/shared.weightTotal:null,rank:null};
}
function calculate(shared,quote){return calculateValidated(sharedInput(shared),quote,0);}
function compare(input,quotes){
 if(!Array.isArray(quotes)||quotes.length<2||quotes.length>6)throw new Error('Compare 2–6 quote options.');
 const shared=sharedInput(input),options=quotes.map((q,i)=>calculateValidated(shared,q,i)),eligible=options.filter(q=>q.affordable);
 let leaders=[];
 if(shared.weightTotal&&eligible.length){
  for(const option of eligible)option.rank=1+eligible.filter(q=>q.numerator>option.numerator).length;
  const highest=Math.max(...eligible.map(q=>q.numerator));leaders=eligible.filter(q=>q.numerator===highest).map(q=>q.index);
 }
 const reserveContingency=roundRatio(shared.otherCosts,shared.contingencyBP,10000),reserveTotal=shared.otherCosts+reserveContingency;
 return {shared,options,leaders,eligible:eligible.map(q=>q.index),status:!eligible.length?'no-fit':!shared.weightTotal?'unweighted':leaders.length>1?'tie':'ranked',reserveContingency,reserveTotal};
}
function nextSteps(result){
 const steps=[];
 if(result.status==='no-fit')steps.push({key:'no-fit',text:'No entered option fits the hard cap. Keep the budget unchanged: collect a lower all-in quote for the same scope, explicitly revise the scope and re-quote, or pause new purchases.'});
 else if(result.status==='unweighted')steps.push({key:'unweighted',text:'All importance weights are zero, so no preference winner is selected. Set at least one importance weight above zero or compare the cost ledger without a ranking.'});
 else if(result.status==='tie')steps.push({key:'tie',text:'The top affordable options tie on your exact weighted score. Price is shown separately, not used as a hidden tie-breaker. Review the underlying scores and quotes before choosing.'});
 else steps.push({key:'ranked',text:'The highest preference-fit option within your entered cap is '+result.options[result.leaders[0]].name+'. This is a shortlist based on your inputs, not a purchase recommendation.'});
 for(const key of attributes){if(result.shared.weights[key]>=7)steps.push({key,text:{aesthetics:'Aesthetics is a high priority. Compare actual samples, finish and color in your intended space, then update your own aesthetics scores.',durability:'Durability / longevity is a high priority. Ask for product-specific evidence, intended-use limits and warranty exclusions, then update your own durability scores. This tool predicts no lifespan.',maintenance:'Ease of maintenance is a high priority. Check the actual cleaning and care instructions, recurring effort and costs, then update your own ease-of-maintenance scores.'}[key]});}
 if(!attributes.some(k=>result.shared.weights[k]>=7))steps.push({key:'review-weights',text:'No importance weight is 7 or higher. Review whether the relative weights reflect what matters to you; the weighted formula still uses every nonzero weight.'});
 steps.push({key:'verify',text:'Verify that every quote covers the same intended scope and quantity basis, and includes labor, removal, delivery, taxes and other project costs without double-counting. A contingency is only your chosen buffer.'});
 return steps;
}
function csv(result){
 const shared=result.shared,rows=[['Renovation quote comparison — user-entered USD and subjective preference fit'],['Hard project cap USD',(shared.budget/100).toFixed(2)],['Other project costs USD',(shared.otherCosts/100).toFixed(2)],['Contingency percent',(shared.contingencyBP/100).toFixed(2)],...attributes.map(k=>[k+' importance /10',shared.weights[k]]),['Outcome',result.status],['Field',...result.options.map(q=>q.name)]];
 const add=(label,fn)=>rows.push([label,...result.options.map(fn)]);
 add('Quantity',q=>q.quantity);add('Unit',q=>q.unit);for(const k of ['unitPrice','material','labor','removal','extras','tax','quoteSubtotal','otherCosts','base','contingency','total','headroom'])add(k+' USD',q=>(q[k]/100).toFixed(2));
 for(const k of attributes)add(k+' user score /10',q=>q.scores[k]);
 add('Weighted numerator',q=>q.numerator);add('Weight denominator',()=>shared.weightTotal);add('Preference fit /10',q=>q.score===null?'Unranked':q.score.toFixed(2));add('Within entered cap',q=>q.affordable?'Yes':'No');add('Affordable preference rank',q=>q.rank===null?'Not ranked':q.rank);
 rows.push(['Limitations','Fictional defaults until replaced; not verified prices, product safety, objective quality, lifespan, contractor advice or permission to proceed. No purchase required.']);
 return rows.map(row=>row.map(cell=>{let s=String(cell);if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');
}
const api={limits,attributes,quoteKeys,parse,roundRatio,calculate,compare,nextSteps,csv};if(typeof module==='object'&&module.exports)module.exports=api;else root.RenovationQuotes=api;
})(typeof globalThis!=='undefined'?globalThis:this);
