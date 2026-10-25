const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {calculate, csv, rules} = require('../assets/cash-goals-model.js');
let checks=0;
function equal(a,b){assert.equal(a,b);checks++;}
function near(a,b){assert.ok(Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);checks++;}
function rejects(x){assert.throws(()=>calculate(x));checks++;}
const base={expenses:3000,reserveMonths:3,cash:15000,goal:10000,months:12,contribution:300,apy:0,stressAmount:0,downside:20};
let r=calculate(base);
equal(r.reserveTarget,9000);equal(r.startingGoalCash,6000);equal(r.goalBalance,9600);equal(r.goalGap,400);equal(r.reserve,9000);equal(r.totalInterest,0);equal(r.rows.length,13);
r=calculate({...base,cash:8000});equal(r.reserve,9000);equal(r.goalBalance,2600);equal(r.rows[3].reserve,8900);equal(r.rows[4].reserveContribution,100);equal(r.rows[4].goalContribution,200);
r=calculate({...base,months:0,apy:25});equal(r.goalBalance,6000);equal(r.contributions,0);equal(r.totalInterest,0);equal(r.rows.length,1);
r=calculate({...base,cash:100,reserveMonths:1,months:2,contribution:100});equal(r.reserveGap,2700);equal(r.goalBalance,0);equal(r.totalGap,12700);
r=calculate({...base,expenses:0,goal:0,cash:0,contribution:0,months:0});equal(r.totalGap,0);equal(r.reserve,0);equal(r.goalRemainder,0);
r=calculate({...base,reserveMonths:0,cash:1000,contribution:0,apy:4,months:12});near(r.goalBalance,1040);near(r.totalInterest,40);
r=calculate({...base,cash:10000,months:1,contribution:100,apy:12});near(r.goalBalance,1000*Math.pow(1.12,1/12)+100);
// Independent closed form when reserve is already filled. Test zero/tiny/high APY and deadlines.
for(const apy of [0,0.00000001,1,4,25]) for(const months of [0,1,12,121,360]) for(const contribution of [0,0.01,300,100000000]){
 const x={...base,apy,months,contribution};const out=calculate(x);
 // Direct independent summation of each contribution's remaining compounding periods.
 let expected=6000*Math.pow(1+apy/100,months/12);
 for(let m=1;m<=months;m++) expected+=contribution*Math.pow(1+apy/100,(months-m)/12);
 near(out.goalBalance,expected);near(out.reserve+out.goalBalance,x.cash+months*contribution+out.totalInterest);
 equal(out.rows.length,months+1);
}
// Reserve-first contribution split at exact and fractional crossings; conservation every row.
for(const cash of [0,100,8999.99,9000,10000])for(const contribution of [0,0.01,333.33,1000]){
 const x={...base,cash,contribution,apy:4,months:24};const out=calculate(x);
 near(out.reserve,Math.min(9000,cash+24*contribution));
 let cumulativeInterest=0;
 out.rows.forEach(row=>{cumulativeInterest+=row.interest;near(row.reserve+row.goalBalance,cash+row.month*contribution+cumulativeInterest);near(row.reserveContribution+row.goalContribution,row.month?contribution:0);assert.ok(row.reserve<=9000);checks++;});
}
for(const downside of [0,20,100]){r=calculate({...base,stressAmount:1234.56,downside});near(r.loss,1234.56*downside/100);near(r.stressValue+r.loss,1234.56);equal(r.goalBalance,9600);}
for(const key of Object.keys(rules))for(const bad of ['', ' ',NaN,Infinity,-1,null,undefined,{},true,'bad']) rejects({...base,[key]:bad});
for(const [key, [,min,max]] of Object.entries(rules)){rejects({...base,[key]:max+1});calculate({...base,[key]:min});checks++;calculate({...base,[key]:max});checks++;}
rejects({...base,months:1.5});
r=calculate(base);const download=csv(r);assert.ok(download.includes('"Month","Reserve contribution USD"'));checks++;assert.ok(download.includes('"12","0.00","300.00","0.00","9000.00","9600.00"'));checks++;
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'money-cash-goals.html'),'utf8');
for(const field of Object.keys(rules)){assert.ok(html.includes(`for="${field}"`));assert.ok(html.includes(`id="${field}"`));checks+=2;}
assert.ok(html.includes('https://compoundyourfuture.com/money-cash-goals.html'));checks++;
for(const file of ['assets/cash-goals-model.js','assets/cash-goals-ui.js']){const code=fs.readFileSync(path.join(root,file),'utf8');new Function(code);checks++;assert.ok(!/localStorage|sessionStorage|fetch\(|XMLHttpRequest|location\.search|sendBeacon/.test(code));checks++;}
console.log(`${checks} cash-goal checks passed (independent growth and conservation checks included).`);
