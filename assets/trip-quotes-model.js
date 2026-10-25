/* Educational quote arithmetic. No network, storage, availability or provider data. */
(function(root){
'use strict';
const limits={party:[1,100,true],budget:[0,100000000,false],contingency:[0,100,false],nights:[0,365,true],airfare:[0,1000000,false],lodging:[0,1000000,false],daily:[0,1000000,false],extras:[0,1000000,false]};
function parse(value,key){
 const rule=limits[key]; if(!rule) throw new Error('Unknown field');
 if(typeof value!=='number' && typeof value!=='string') throw new Error('Enter a number.');
 const s=String(value).trim();
 if(!s || !/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Enter a nonnegative number, without symbols or exponents.');
 const n=Number(s);
 if(!Number.isFinite(n)||n<rule[0]||n>rule[1])throw new Error('Enter a value from '+rule[0]+' to '+rule[1]+'.');
 if(rule[2]&&(!Number.isInteger(n)||(s.includes('.')&&!/^0+$/.test(s.split('.')[1]))))throw new Error('Enter a whole number.');
 if(!rule[2]&&s.includes('.')&&s.split('.')[1].length>2)throw new Error('Use at most two decimal places.');
 return n;
}
const cents=n=>Math.round(n*100);
function calculate(shared,scenario){
 const party=parse(shared.party,'party'), budget=cents(parse(shared.budget,'budget')), bp=cents(parse(shared.contingency,'contingency'));
 const nights=parse(scenario.nights,'nights'), days=nights+1;
 const airfare=cents(parse(scenario.airfare,'airfare')),lodgingRate=cents(parse(scenario.lodging,'lodging')),dailyRate=cents(parse(scenario.daily,'daily')),extras=cents(parse(scenario.extras,'extras'));
 const lodging=lodgingRate*nights,daily=dailyRate*party*days,fixed=lodging+daily+extras,subtotal=fixed+airfare;
 // Split quotient/remainder so even the largest supported inputs never multiply
 // into an unsafe integer; half-cent ties round upward.
 const totalAt=amount=>amount+Math.floor(amount/10000)*bp+Math.floor(((amount%10000)*bp+5000)/10000);
 const contingency=totalAt(subtotal)-subtotal,total=subtotal+contingency;
 // Find the greatest whole cent airfare that stays within budget, including rounded contingency.
 // null means non-airfare costs alone exceed the hard cap; zero remains a valid ceiling.
 let airfareCeiling=null;
 if(totalAt(fixed)<=budget){let low=0,high=budget;while(low<high){const mid=Math.ceil((low+high)/2);if(totalAt(fixed+mid)<=budget)low=mid;else high=mid-1;}airfareCeiling=low;}
 const extraNightBase=lodgingRate+party*dailyRate;
 const extraNightTotal=totalAt(subtotal+extraNightBase)-total;
 return {party,budget,bp,nights,days,airfare,lodgingRate,dailyRate,extras,lodging,daily,subtotal,contingency,total,headroom:budget-total,airfareCeiling,extraNightBase,extraNightTotal};
}
function compare(shared,a,b){const A=calculate(shared,a),B=calculate(shared,b);return {A,B,difference:B.total-A.total,airfareSaving:A.airfare-B.airfare,otherBaseChange:(B.subtotal-B.airfare)-(A.subtotal-A.airfare),contingencyChange:B.contingency-A.contingency};}
const api={parse,calculate,compare,limits};if(typeof module==='object'&&module.exports)module.exports=api;else root.TripQuotes=api;
})(typeof globalThis!=='undefined'?globalThis:this);
