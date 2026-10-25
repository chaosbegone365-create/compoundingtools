/* Dependency-free deterministic model, markup and mocked-DOM checks. No browser execution. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),M=require('../assets/renovation-quotes-model.js');let checks=0;
const equal=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;},ok=(a,msg)=>{assert.ok(a,msg);checks++;},throws=(fn,msg)=>{assert.throws(fn,msg);checks++;};
const shared={budget:30000,otherCosts:6000,contingency:10,weights:{aesthetics:8,durability:8,maintenance:4}};
const quote=(name,price,labor,tax,scores)=>({name,unit:'sq ft',quantity:800,unitPrice:price,labor,removal:1500,extras:0,tax,...scores});
const defaults=[quote('Option A (example)',8,9000,512,{aesthetics:9,durability:5,maintenance:6}),quote('Option B (example)',12,9000,768,{aesthetics:6,durability:9,maintenance:8}),quote('Option C (example)',18,9500,1152,{aesthetics:8,durability:8,maintenance:7})];
const r=M.compare(shared,defaults);equal(r.options.map(q=>q.total),[2575320,2955480,3580720]);equal(r.options.map(q=>q.headroom),[424680,44520,-580720]);equal(r.options.map(q=>q.score),[6.8,7.6,7.8]);equal(r.options.map(q=>q.rank),[2,1,null]);equal(r.leaders,[1]);equal(r.status,'ranked');equal(r.reserveTotal,660000);
equal(M.compare({...shared,weights:{aesthetics:10,durability:0,maintenance:0}},defaults).leaders,[0]);
equal(M.compare({...shared,weights:{aesthetics:0,durability:10,maintenance:0}},defaults).leaders,[1]);
equal(M.compare({...shared,budget:40000},defaults).leaders,[2]);equal(shared.budget,30000);
const tied=defaults.map(q=>({...q,aesthetics:7,durability:7,maintenance:7}));const tie=M.compare(shared,tied);equal(tie.status,'tie');equal(tie.leaders,[0,1]);equal(tie.options.map(q=>q.rank),[1,1,null]);
const competition=M.compare({...shared,budget:40000},[tied[0],tied[1],{...defaults[2],aesthetics:1,durability:1,maintenance:1}]);equal(competition.options.map(q=>q.rank),[1,1,3]);
const zero=M.compare({...shared,weights:{aesthetics:0,durability:0,maintenance:0}},defaults);equal(zero.status,'unweighted');equal(zero.leaders,[]);ok(zero.options.every(q=>q.score===null&&q.rank===null));equal(zero.options.map(q=>q.total),r.options.map(q=>q.total));
const nofit=M.compare({...shared,budget:1},defaults);equal(nofit.status,'no-fit');equal(nofit.leaders,[]);ok(nofit.options.every(q=>!q.affordable&&q.rank===null));equal(nofit.shared.budget,100);
const exact=M.compare({...shared,budget:29554.80},defaults);equal(exact.options[1].headroom,0);equal(exact.options[1].affordable,true);equal(M.compare({...shared,budget:29554.79},defaults).options[1].affordable,false);
const zeroQuote={...defaults[0],quantity:0,unitPrice:0,labor:0,removal:0,extras:0,tax:0};equal(M.calculate({...shared,budget:0,otherCosts:0},zeroQuote).total,0);equal(M.calculate(shared,{...defaults[0],quantity:0}).material,0);ok(M.calculate(shared,{...defaults[0],quantity:0}).total>0);
const fraction=M.calculate({...shared,otherCosts:0,contingency:50},{...zeroQuote,quantity:.01,unitPrice:.5});equal(fraction.material,1);equal(fraction.contingency,1);equal(fraction.total,2);
const fractionDown=M.calculate({...shared,otherCosts:0,contingency:0},{...zeroQuote,quantity:.01,unitPrice:.49});equal(fractionDown.total,0);
for(const value of ['',null,undefined,NaN,Infinity,-1,'-1','1e2','0x10','1,000','$1','1.001','100000001'])throws(()=>M.parse(value,'budget'));
for(const value of ['0.5','10.00000000000000001','11','-1','1e0'])throws(()=>M.parse(value,'aesthetics'));
for(const value of ['', ' ', '\nlabel', 'a'.repeat(81)])throws(()=>M.parse(value,'name'));
throws(()=>M.parse('a'.repeat(31),'unit'));throws(()=>M.parse('1','unknown'));throws(()=>M.compare(shared,[defaults[0]]));throws(()=>M.compare(shared,Array(7).fill(defaults[0])));
equal(M.parse('10.00','aesthetics'),10);equal(M.parse(' 0.25 ','quantity'),.25);equal(M.parse(' Material label ','name'),'Material label');
const before=JSON.stringify({shared,defaults});M.compare(shared,defaults);equal(JSON.stringify({shared,defaults}),before);
const maxShared={budget:100000000,otherCosts:1000000,contingency:100,weights:{aesthetics:10,durability:10,maintenance:10}},maxQuote={name:'Max',unit:'unit',quantity:100000,unitPrice:1000000,labor:1000000,removal:1000000,extras:1000000,tax:1000000,aesthetics:10,durability:10,maintenance:10};
const maximum=M.calculate(maxShared,maxQuote);equal(maximum.total,20001000000000);ok(Number.isSafeInteger(maximum.total));equal(maximum.score,10);
// Independent integer ledger using input decimal strings; deterministic pseudo-random scenarios.
function integer(s){const [a,b='']=String(s).split('.');return BigInt(a)*100n+BigInt(b.padEnd(2,'0'));}
function ledger(s,q){const material=(integer(q.quantity)*integer(q.unitPrice)+50n)/100n;const quoteTotal=material+['labor','removal','extras','tax'].reduce((sum,k)=>sum+integer(q[k]),0n),base=quoteTotal+integer(s.otherCosts);return {material:Number(material),quoteSubtotal:Number(quoteTotal),base:Number(base),contingency:Number((base*integer(s.contingency)+5000n)/10000n),total:Number(base+(base*integer(s.contingency)+5000n)/10000n)};}
let seed=20261025;function random(n){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;}const amount=max=>(random(max)/100).toFixed(2);
for(let i=0;i<700;i++){
 const s={budget:amount(1000000000),otherCosts:amount(100000000),contingency:amount(10001),weights:{aesthetics:random(11),durability:random(11),maintenance:random(11)}};
 const q={name:'Fixture '+i,unit:'units',quantity:amount(10000001),unitPrice:amount(100000001),labor:amount(100000001),removal:amount(100000001),extras:amount(100000001),tax:amount(100000001),aesthetics:random(11),durability:random(11),maintenance:random(11)};
 const got=M.calculate(s,q),want=ledger(s,q);for(const k of Object.keys(want))equal(got[k],want[k],k+' ledger '+i);
 equal(got.affordable,BigInt(want.total)<=integer(s.budget));ok(Number.isSafeInteger(got.total));
 const high=M.calculate({...s,budget:100000000},q);equal(got.total,high.total);equal(got.numerator,high.numerator);
}
const stepKeys=x=>M.nextSteps(x).map(step=>step.key);equal(stepKeys(r),['ranked','aesthetics','durability','verify']);ok(stepKeys(M.compare({...shared,weights:{aesthetics:0,durability:0,maintenance:10}},defaults)).includes('maintenance'));ok(stepKeys(zero).includes('unweighted'));ok(stepKeys(nofit).includes('no-fit'));ok(stepKeys(tie).includes('tie'));ok(stepKeys(M.compare({...shared,weights:{aesthetics:1,durability:1,maintenance:1}},defaults)).includes('review-weights'));
const csv=M.csv(r);ok(csv.includes('"total USD","25753.20","29554.80","35807.20"'));ok(csv.includes('"Preference fit /10","6.80","7.60","7.80"'));ok(csv.includes('"Hard project cap USD","30000.00"'));
for(const name of ['=HYPERLINK("https://example.invalid")','+SUM(1,2)','-1+2','@SUM(1,2)',' =1+1']){const x=M.csv(M.compare(shared,[{...defaults[0],name},defaults[1]]));ok(x.includes('"\''+name.trim().replace(/"/g,'""')+'"'),'CSV injection protected');}
const html=fs.readFileSync(path.join(root,'home-renovation-quotes.html'),'utf8'),ui=fs.readFileSync(path.join(root,'assets/renovation-quotes-ui.js'),'utf8'),css=fs.readFileSync(path.join(root,'assets/renovation-quotes.css'),'utf8');
ok(html.includes('content="noindex,follow"'));ok(html.includes('Draft calculator. Fictional examples'));ok(html.includes('https://compoundyourfuture.com/home-renovation-quotes.html'));ok(html.includes('not objective product quality, safety or suitability'));ok(html.includes('No new purchase is a valid route'));ok(html.includes('There are no purchase or affiliate links'));
const htmlIDs=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);equal(new Set(htmlIDs).size,htmlIDs.length,'Unique IDs');
const fieldMarkup=[...html.matchAll(/<input\s[^>]*data-field="[^"]+"[^>]*>/g)].map(m=>m[0]);equal(fieldMarkup.length,39);
const get=(tag,key)=>(tag.match(new RegExp('(?:^|\\s)'+key+'="([^"]*)"'))||[])[1];
for(const field of fieldMarkup){const id=get(field,'id');ok(html.includes('for="'+id+'"'));ok(field.includes('required'));}
for(const source of [ui,fs.readFileSync(path.join(root,'assets/renovation-quotes-model.js'),'utf8')]){ok(!/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|sendBeacon)\b/.test(source));ok(!/innerHTML|outerHTML|insertAdjacentHTML/.test(source));}
ok(css.includes('minmax(0,1fr)'));ok(css.includes('overflow:auto'));ok(css.includes('[hidden]{display:none!important}'));
// Minimal DOM doubles test real UI handlers, not rendering or native browser validation.
class Node{constructor(id=''){this.id=id;this.value='';this.children=[];this.attrs={};this.listeners={};this.hidden=false;this.textContent='';this.dataset={};this.labels=[{textContent:id}];}append(...n){this.children.push(...n);}replaceChildren(...n){this.children=n;}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}addEventListener(k,fn){this.listeners[k]=fn;}focus(){focused=this.id;}click(){if(this.listeners.click)this.listeners.click({preventDefault(){}});else if(this.download)downloads.push({name:this.download,url:this.href});}remove(){}querySelectorAll(){return fields;}}
let focused='',downloads=[],blobs=[],revoked=[];const nodes=Object.fromEntries(htmlIDs.map(id=>[id,new Node(id)])),fields=fieldMarkup.map(tag=>{const n=nodes[get(tag,'id')];n.value=get(tag,'value');n.initial=n.value;n.dataset.field=get(tag,'data-field');return n;});
const sandbox={window:{RenovationQuotes:M},document:{getElementById:id=>{assert.ok(nodes[id],'Unknown DOM id '+id);return nodes[id];},createElement:()=>new Node(),body:new Node()},Intl,Blob:class{constructor(parts){this.parts=parts;blobs.push(this);}},URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL:url=>revoked.push(url)},setTimeout:fn=>fn()};
vm.runInNewContext(ui,sandbox,{filename:'renovation-quotes-ui.js'});const result=nodes['renovation-results'],form=nodes['renovation-quotes-form'];const edit=(id,value)=>{nodes[id].value=String(value);form.listeners.input();};
equal(result.hidden,false);ok(nodes['quote-outcome'].textContent.includes('B · Option B'));equal(nodes['quote-rows'].children.length,17);equal(nodes['quote-summaries'].children.length,3);ok(nodes['cheaper-options'].children[0].textContent.includes('$3,801.60'));ok(nodes['hard-cap-summary'].textContent.includes('$30,000.00'));
edit('weight-aesthetics',10);edit('weight-durability',0);edit('weight-maintenance',0);ok(nodes['quote-outcome'].textContent.includes('A · Option A'));equal(nodes.budget.value,'30000');ok(nodes['quote-next-steps'].children.some(n=>n.textContent.includes('Aesthetics is a high priority')));ok(!nodes['quote-next-steps'].children.some(n=>n.textContent.includes('Durability / longevity is a high priority')));
edit('weight-aesthetics',0);ok(nodes['quote-outcome'].textContent.includes('all importance weights are zero'));ok(nodes['cheaper-options'].children[0].textContent.includes('Cost order only'));
edit('budget',1);ok(nodes['quote-outcome'].textContent.includes('No entered quote'));ok(nodes['reserve-floor'].textContent.includes('reserve alone exceeds'));equal(nodes.budget.value,'1');
for(const [id,value] of [['budget',''],['a-labor','-1'],['a-quantity','1.001'],['b-name',''],['c-unit',' '],['weight-durability','.5']]){const before=nodes[id].value;edit(id,value);equal(result.hidden,true);equal(nodes[id].attrs['aria-invalid'],'true');equal(nodes['quote-rows'].children.length,0);equal(nodes['quote-summaries'].children.length,0);const count=downloads.length;nodes['renovation-export'].click();equal(downloads.length,count);edit(id,before);equal(result.hidden,false);}
edit('budget','');form.listeners.submit({preventDefault(){}});equal(focused,'budget');
for(const n of fields)n.value=n.initial;form.listeners.reset();equal(result.hidden,false);ok(nodes['quote-outcome'].textContent.includes('B · Option B'));equal(nodes.budget.value,'30000');
edit('a-name','<img src=x onerror=alert(1)>');equal(nodes['quote-summaries'].children[0].children[0].textContent,'A · <img src=x onerror=alert(1)>');equal(nodes['quote-summaries'].children[0].children[0].children.length,0);
edit('a-aesthetics',7);edit('a-durability',7);edit('a-maintenance',7);edit('b-aesthetics',7);edit('b-durability',7);edit('b-maintenance',7);ok(nodes['quote-outcome'].textContent.includes('Preference tie'));
nodes['renovation-export'].click();equal(downloads.length,1);equal(downloads[0].name,'renovation-quote-comparison.csv');ok(blobs[0].parts[0].includes('"Outcome","tie"'));equal(revoked,['blob:synthetic']);
for(const n of fields)n.value=n.initial;form.listeners.reset();equal(nodes['quote-rows'].children.length,17);equal(nodes['quote-summaries'].children.length,3);equal(nodes['renovation-status'].className,'');
console.log('PASS renovation quotes: '+checks+' deterministic model, independent-ledger, markup and mocked-DOM checks. Browser layout not executed.');
