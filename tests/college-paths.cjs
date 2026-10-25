'use strict';
const assert=require('node:assert/strict');const {calculate,csv}=require('../assets/college-path-model.js');let checks=0;
const eq=(a,b)=>{assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);checks++;};const bad=f=>{assert.throws(f);checks++;};
const phase=()=>({sector:'public',residency:'in',living:'home',tuition:10000,fees:1000,housing:4000,meals:2000,books:500,transport:500,entry:1000,confirmed:3000,hypothetical:2000});
const scenario=()=>({path:'four',growth:0,contribution:5000,phases:[phase()]});const input=()=>({scenarios:[scenario(),scenario()]});
let x=input(),r=calculate(x);eq(r.scenarios[0].totals.gross,73000);eq(r.scenarios[0].totals.net,61000);eq(r.scenarios[0].totals.possibleNet,53000);eq(r.scenarios[0].totals.gap,41000);eq(r.scenarios[0].totals.possibleGap,33000);eq(r.difference,0);
x=input();x.scenarios[0].path='two';r=calculate(x);eq(r.scenarios[0].rows.length,2);eq(r.scenarios[0].totals.gross,37000);eq(r.difference,30000);
x=input();x.scenarios[0]={path:'transfer',growth:10,contribution:0,phases:[{...phase(),tuition:100,fees:0,housing:0,meals:0,books:0,transport:0,entry:10,confirmed:0,hypothetical:0},{...phase(),tuition:200,fees:0,housing:0,meals:0,books:0,transport:0,entry:20,confirmed:0,hypothetical:0}]};r=calculate(x);[110,110,266.2,266.2].forEach((v,i)=>eq(r.scenarios[0].rows[i].gross,v));eq(r.scenarios[0].totals.gross,752.4);eq(r.scenarios[0].rows[2].entry,24.2);eq(r.scenarios[0].rows[3].entry,0);
x=input();Object.assign(x.scenarios[0].phases[0],{confirmed:50000,hypothetical:10000});r=calculate(x);eq(r.scenarios[0].totals.net,0);eq(r.scenarios[0].totals.possibleGap,0);eq(r.scenarios[0].totals.unusedAid,167000);
x=input();x.scenarios[0].contribution=20000;r=calculate(x);eq(r.scenarios[0].totals.gap,0);eq(r.scenarios[0].totals.cashUsed,61000);
// Independent oracle across varying routes, growth, costs and non-overlapping aid.
for(let n=0;n<100;n++){x=input();const s=x.scenarios[0];s.path=n%3===0?'transfer':n%3===1?'two':'four';s.growth=n%21;s.contribution=n*137;s.phases=[{...phase(),tuition:n*211,confirmed:n*101,hypothetical:n*33}];if(s.path==='transfer')s.phases.push({...phase(),tuition:n*401,entry:n*7});r=calculate(x).scenarios[0];let total=0,gap=0,possible=0;for(let y=0;y<(s.path==='two'?2:4);y++){const p=s.phases[s.path==='transfer'&&y>=2?1:0];const gross=(p.tuition+p.fees+p.housing+p.meals+p.books+p.transport+((y===0||(s.path==='transfer'&&y===2))?p.entry:0))*Math.pow(1+s.growth/100,y);total+=gross;gap+=Math.max(0,gross-p.confirmed-s.contribution);possible+=Math.max(0,gross-p.confirmed-p.hypothetical-s.contribution);}eq(r.totals.gross,total);eq(r.totals.gap,gap);eq(r.totals.possibleGap,possible);eq(r.rows.reduce((a,v)=>a+v.entry,0),r.totals.entry);}
for(const v of ['',null,undefined,-1,Infinity,NaN,1e8,true]){for(const k of ['tuition','fees','housing','meals','books','transport','entry','confirmed','hypothetical']){x=input();x.scenarios[0].phases[0][k]=v;bad(()=>calculate(x));}x=input();x.scenarios[0].contribution=v;bad(()=>calculate(x));}
for(const v of ['',-1,21,Infinity,null]){x=input();x.scenarios[0].growth=v;bad(()=>calculate(x));}
for(const [k,v] of [['path','x'],['phases',[]]]){x=input();x.scenarios[0][k]=v;bad(()=>calculate(x));}
for(const k of ['sector','residency','living']){x=input();x.scenarios[0].phases[0][k]='unknown';bad(()=>calculate(x));}
bad(()=>calculate({scenarios:[]}));bad(()=>calculate(null));
x=input();for(const s of x.scenarios){s.growth=20;s.contribution=1e7;Object.keys(s.phases[0]).filter(k=>typeof s.phases[0][k]==='number').forEach(k=>s.phases[0][k]=1e7);}r=calculate(x);assert.ok(Number.isFinite(r.scenarios[0].totals.gross));checks++;
const output=csv(calculate(input()));assert.ok(output.includes('hypothetical aid'));assert.ok(output.includes('73000.00'));assert.ok(output.includes('"1","1","10000.00"'));assert.ok(output.includes('No cash carryover'));checks+=4;
console.log(`${checks} college-path numeric assertions passed`);
// Persistent educational context is required independently of an excess-aid warning.
const fsHelp=require('node:fs');
const helpHTML=fsHelp.readFileSync('family-college-paths.html','utf8');
const helpUI=fsHelp.readFileSync('assets/college-path-ui.js','utf8');
for(const text of ['Unused annual cash is not carried to later years in this model.','Verify award restrictions and conditions with the school; this model does not determine eligibility.']){
 assert.ok(helpHTML.includes(text));assert.ok(helpUI.includes(text));
}
assert.ok(helpUI.includes('aria-describedby='));
console.log('5 college help-context assertions passed; browser associations covered separately.');
