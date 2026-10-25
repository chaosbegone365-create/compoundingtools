const assert=require('node:assert/strict');
const {calculate,csv}=require('../assets/school-cost-model.js');
let checks=0;const equal=(a,b)=>{checks++;assert.equal(a,b)};const near=(a,b)=>{checks++;assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`)};
const child=(extra={})=>({start:1,duration:5,tuition:0,aid:0,discount:0,fees:300,aftercare:400,months:10,summer:250,weeks:8,extras:500,entry:100,...extra});
const scenario=(extra={})=>({growth:3,transport:600,children:[child(),child()],...extra});
const example=()=>({years:5,scenarios:[scenario(),scenario({transport:1800,children:[child({tuition:15000,aid:2000,aftercare:200}),child({tuition:15000,aid:2000,discount:1000,aftercare:200})]})]});
const fail=(input,pattern)=>{checks++;assert.throws(()=>calculate(input),pattern)};
let r=calculate(example());equal(r.scenarios[0].rows[0].total,14400);equal(r.scenarios[1].rows[0].total,36600);equal(r.scenarios[1].rows[0].tuition,25000);equal(r.scenarios[0].rows[0].transport,600);
// Independent closed-form totals: recurring gross prices form a geometric sum; fixed aid repeats five times.
const sum=(1.03**5-1)/.03;near(r.scenarios[0].total,14200*sum+200);near(r.scenarios[1].total,41400*sum-25000+200);near(r.gap,27200*sum-25000);
equal(r.scenarios[0].rows[1].entry,0);near(r.scenarios[0].rows[1].total,14626);
let input=example();input.years=1;equal(calculate(input).gap,22200);
input=example();input.scenarios.forEach(s=>s.growth=0);r=calculate(input);equal(r.scenarios[0].total,71200);equal(r.scenarios[1].total,182200);equal(r.gap,111000);
input=example();input.scenarios.reverse();near(calculate(input).gap,-calculate(example()).gap);
input={years:3,scenarios:[0,1].map(()=>scenario({growth:10,transport:100,children:[child({start:2,duration:1,tuition:1000,aid:100,discount:50,fees:0,aftercare:0,summer:0,extras:0,entry:100})]}))};r=calculate(input);equal(r.scenarios[0].rows[0].total,0);near(r.scenarios[0].rows[1].tuition,950);near(r.scenarios[0].rows[1].total,1170);equal(r.scenarios[0].rows[2].total,0);
const zero=child(Object.fromEntries(['tuition','aid','discount','fees','aftercare','summer','extras','entry'].map(k=>[k,0])));input={years:20,scenarios:[0,1].map(()=>scenario({growth:20,transport:0,children:[zero]}))};equal(calculate(input).gap,0);equal(calculate(input).scenarios[0].total,0);
input=example();input.scenarios[0].children[0].start=20;equal(calculate(input).scenarios[0].rows[0].total,7500);
input={years:2,scenarios:[0,1].map(()=>scenario({growth:-20,transport:0,children:[child({...zero,tuition:100,aid:90})]}))};r=calculate(input);equal(r.scenarios[0].rows[0].tuition,10);equal(r.scenarios[0].rows[1].tuition,0);
for(const value of ['',null,undefined,NaN,Infinity,-1,21,1.5,'xyz',true]){input=example();input.years=value;fail(input,/Projection years/);}
for(const key of ['tuition','aid','discount','fees','aftercare','summer','extras','entry','start','duration','months','weeks'])for(const value of ['',null,NaN,Infinity,-1,1e100]){input=example();input.scenarios[0].children[0][key]=value;fail(input,/enter/);}
for(const key of ['start','duration','months','weeks']){input=example();input.scenarios[0].children[0][key]=1.5;fail(input,/whole number/);}
for(const [key,value] of [['months',13],['weeks',53],['start',0],['duration',0],['duration',21]]){input=example();input.scenarios[0].children[0][key]=value;fail(input,/enter/);}
for(const growth of [-21,21,Infinity,'']){input=example();input.scenarios[0].growth=growth;fail(input,/price change/);}
input=example();input.scenarios[0].children[0].aid=1;fail(input,/cannot exceed/);
input=example();input.scenarios[1].children[1].discount=14000;fail(input,/cannot exceed/);
input=example();input.scenarios[0].children=[];fail(input,/one to six/);
input=example();input.scenarios[0].children=Array(7).fill(child());fail(input,/one to six/);
input=example();input.scenarios[0].children.pop();fail(input,/same number/);
input=example();input.scenarios=[];fail(input,/Exactly two/);
input={years:20,scenarios:[0,1].map(()=>scenario({growth:20,children:Array.from({length:6},()=>child({duration:20,tuition:1e7,fees:1e7,aftercare:1e7,months:12,summer:1e7,weeks:52,extras:1e7,entry:1e7}))}))};checks++;assert.ok(Number.isFinite(calculate(input).scenarios[0].total)&&calculate(input).scenarios[0].total<=1e12);
const output=csv(calculate(example()));equal(output.split('\r\n')[3].split(',').length,14);checks++;assert.match(output,/"1","0.00","12000.00","1600.00","600.00","200.00","14400.00"/);checks++;assert.match(output,/"Private minus public"/);checks++;assert.match(output,/"discount","1000"/);checks++;assert.match(output,/"Projection years","5"/);
// Equal scenarios, order invariance, and independent per-year decomposition for many ordinary inputs.
for(let n=1;n<=6;n++)for(const growth of [-20,0,3,20]){input={years:10,scenarios:[0,1].map(()=>scenario({growth,children:Array.from({length:n},(_,j)=>child({start:j+1,duration:3,tuition:1000+j*123,aid:100,discount:50}))}))};r=calculate(input);equal(r.gap,0);let expected=0;for(let y=1;y<=10;y++){const active=input.scenarios[0].children.filter(c=>y>=c.start&&y<c.start+c.duration);let annual=active.length?600*(1+growth/100)**(y-1):0;for(const c of active){const f=(1+growth/100)**(y-1);annual+=Math.max(0,c.tuition*f-150)+(300+400*10+250*8+500)*f+(y===c.start?100*f:0);}near(r.scenarios[0].rows[y-1].total,annual);expected+=annual;}near(r.scenarios[0].total,expected);}
console.log(`${checks} school-cost assertions passed`);
console.log(JSON.stringify({publicFiveYear:calculate(example()).scenarios[0].total,privateFiveYear:calculate(example()).scenarios[1].total,gap:calculate(example()).gap}));
