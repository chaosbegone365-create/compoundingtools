/* Pure cost-scenario arithmetic. No storage, requests, admissions or eligibility predictions. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CollegePaths=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const COSTS=['tuition','fees','housing','meals','books','transport'];
const PATHS={'two':[2],'four':[4],'transfer':[2,2]};
function number(v,label,min=0,max=10000000){if(v===null||v===undefined||typeof v==='boolean'||String(v).trim()==='')throw Error(label+': enter a number (use 0 if none).');const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(label+': use a number from '+min+' to '+max+'.');return n;}
function choice(v,allowed,label){if(!allowed.includes(v))throw Error('Choose a valid '+label+'.');return v;}
function calculate(input){
 if(!input||!Array.isArray(input.scenarios)||input.scenarios.length!==2)throw Error('Enter exactly two pathways.');
 const scenarios=input.scenarios.map((s,index)=>{
 const path=choice(s.path,Object.keys(PATHS),'pathway'),durations=PATHS[path];
 const growth=number(s.growth,'Path '+(index+1)+' annual cost growth',0,20),contribution=number(s.contribution,'Annual cash available');
 if(!Array.isArray(s.phases)||s.phases.length!==durations.length)throw Error('Enter costs for each active study stage.');
 const phases=s.phases.map(p=>{const v={sector:choice(p.sector,['public','private'],'institution type'),residency:choice(p.residency,['in','out'],'residency'),living:choice(p.living,['home','campus','off'],'living arrangement')};for(const k of [...COSTS,'entry','confirmed','hypothetical'])v[k]=number(p[k],k);return v;});
 const rows=[];let year=0;
 phases.forEach((p,stage)=>{for(let local=0;local<durations[stage];local++){
 const factor=(1+growth/100)**year;year++;
 const row={year,stage:stage+1};for(const k of COSTS)row[k]=p[k]*factor;
 row.entry=local===0?p.entry*factor:0;row.gross=COSTS.reduce((sum,k)=>sum+row[k],row.entry);
 row.confirmed=Math.min(row.gross,p.confirmed);row.hypothetical=Math.min(row.gross-row.confirmed,p.hypothetical);
 row.unusedAid=p.confirmed+p.hypothetical-row.confirmed-row.hypothetical;
 row.net=row.gross-row.confirmed;row.possibleNet=row.net-row.hypothetical;
 row.cashUsed=Math.min(row.net,contribution);row.gap=Math.max(0,row.net-contribution);row.possibleGap=Math.max(0,row.possibleNet-contribution);
 if(!Object.values(row).every(Number.isFinite)||row.gross>1e12)throw Error('Projected cost exceeds supported range.');rows.push(row);
 }});
 const totals={};for(const k of [...COSTS,'entry','gross','confirmed','hypothetical','unusedAid','net','possibleNet','cashUsed','gap','possibleGap'])totals[k]=rows.reduce((n,r)=>n+r[k],0);
 if(totals.gross>1e12)throw Error('Projected total exceeds supported range.');
 return {path,growth,contribution,phases,rows,totals};
 });return {scenarios,difference:scenarios[1].totals.net-scenarios[0].totals.net};
}
function csv(result){const rows=[['College pathway cost scenarios — USD nominal'],['Not admissions, aid eligibility or borrowing approval. Hypothetical aid is NOT confirmed.'],['Path','Year','Stage',...COSTS,'entry','gross','confirmed aid used','hypothetical aid used','excess aid ignored','net after confirmed aid','net if hypothetical aid received','cash used','funding gap confirmed only','funding gap with hypothetical aid']];result.scenarios.forEach((s,i)=>{s.rows.forEach(r=>rows.push(['Path '+(i+1),r.year,r.stage,...[...COSTS,'entry','gross','confirmed','hypothetical','unusedAid','net','possibleNet','cashUsed','gap','possibleGap'].map(k=>r[k].toFixed(2))]));rows.push(['Path '+(i+1)+' total','','',...[...COSTS,'entry','gross','confirmed','hypothetical','unusedAid','net','possibleNet','cashUsed','gap','possibleGap'].map(k=>s.totals[k].toFixed(2))]);rows.push(['Path '+(i+1)+' assumptions',s.path,'growth %',s.growth,'fixed annual cash',s.contribution]);s.phases.forEach((p,j)=>{rows.push(['Stage '+(j+1)+' year-one-dollar assumptions']);Object.entries(p).forEach(([k,v])=>rows.push([k,v]));});});rows.push(['Costs inflate from study year 1, including transfer-stage costs. Aid and annual cash stay flat. Entry charged once per stage. No cash carryover. No investment growth, interest, taxes or loan limits.']);return rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');}
return {calculate,csv,COSTS};
});
