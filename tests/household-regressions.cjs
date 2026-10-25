// Dependency-free arithmetic, input-validation and event-wiring regression tests.
// DOM is mocked: these tests do not establish browser rendering/accessibility.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));let count=0;
function load(name){
 const html=fs.readFileSync(path.join(root,name),'utf8');
 const fields=[...html.matchAll(/<input\b[^>]*value="([^"]*)"[^>]*>/g)].map(m=>({value:m[1]}));
 const listeners={},answer={textContent:''};const form={addEventListener:(event,fn)=>listeners[event]=fn};
 const sandbox={Intl,Number,document:{querySelectorAll:()=>fields,getElementById:id=>id==='answer'?answer:form}};
 vm.createContext(sandbox);const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);vm.runInContext(script,sandbox);
 return {fields,listeners,answer,set(values){values.forEach((v,i)=>fields[i].value=String(v));return vm.runInContext('compute()',sandbox);}};
}
function test(label,fn){fn();count++;console.log('PASS',label)}
const cases=[
 ['career-raise.html',['100000','5'],'Annual raise: $5,000.00 · New salary: $105,000.00 · Gross monthly increase: $416.67'],
 ['family-childcare.html',['40','25'],'Weekly base cost: $1,000.00 · Annual cost (52 weeks): $52,000.00 · Monthly average: $4,333.33'],
 ['family-one-income.html',['6500','5000'],'Monthly remainder (surplus): $1,500.00 · Annualized remainder: $18,000.00']
];
for(const [name,normal,expected] of cases){
 const c=load(name);
 test(name+' ordinary worked example',()=>assert.equal(c.set(normal),expected));
 test(name+' zero values',()=>{const r=c.set([0,0]);assert.ok(r.includes('$0.00'));assert.ok(!/NaN|∞|valid|large|Complete/.test(r));});
 for(const [label,input] of [['empty',['',normal[1]]],['whitespace',[normal[0],'  ']],['negative',[-1,normal[1]]],['negative second',[normal[0],-1]],['non-numeric',['abc',normal[1]]],['infinite',[normal[0],'Infinity']],['overflow',[1e308,name==='family-one-income.html'?0:1e308]]])test(name+' '+label,()=>assert.match(c.set(input),/Complete|valid|too large/));
 test(name+' live recalculation',()=>{c.set(normal);c.listeners.input();assert.equal(c.answer.textContent,expected);});
 test(name+' invalid edit clears stale result',()=>{c.set(['',normal[1]]);c.listeners.input();assert.match(c.answer.textContent,/Complete/);assert.ok(!c.answer.textContent.includes('$'));});
 test(name+' keyboard submit handler',()=>{c.set(normal);let prevented=false;c.listeners.submit({preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(c.answer.textContent,expected);});
}
const salary=load('career-raise.html');
test('zero raise preserves salary',()=>assert.equal(salary.set([100000,0]),'Annual raise: $0.00 · New salary: $100,000.00 · Gross monthly increase: $0.00'));
test('fractional salary raise',()=>assert.equal(salary.set([80000,2.5]),'Annual raise: $2,000.00 · New salary: $82,000.00 · Gross monthly increase: $166.67'));
const care=load('family-childcare.html');
test('fractional care schedule',()=>assert.equal(care.set([12.5,20]),'Weekly base cost: $250.00 · Annual cost (52 weeks): $13,000.00 · Monthly average: $1,083.33'));
const family=load('family-one-income.html');
test('shortfall is valid and labeled',()=>assert.equal(family.set([6500,7000]),'Monthly remainder (shortfall): -$500.00 · Annualized remainder: -$6,000.00'));
test('equal income and outgoings balanced',()=>assert.equal(family.set([6500,6500]),'Monthly remainder (balanced): $0.00 · Annualized remainder: $0.00'));
test('zero income with expenses',()=>assert.equal(family.set([0,500]),'Monthly remainder (shortfall): -$500.00 · Annualized remainder: -$6,000.00'));
console.log(`${count} household regression checks passed (mock DOM; no browser claim).`);
