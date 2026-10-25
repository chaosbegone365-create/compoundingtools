'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../home-mortgage.html'),'utf8'),nodes={};
const make=()=>({value:'',textContent:'',children:[],listeners:{},append(...a){this.children.push(...a)},replaceChildren(...a){this.children=a},addEventListener(t,f){this.listeners[t]=f}});
const node=id=>nodes[id]??=make();
for(const [,id,value] of html.matchAll(/<input\b[^>]*id="([^"]+)"[^>]*value="([^"]+)"[^>]*>/g))node(id).value=value;
const sandbox={document:{getElementById:node,createElement:make},Intl,Number,Math};vm.createContext(sandbox);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],sandbox);
const run=s=>vm.runInContext(s,sandbox),set=(id,v)=>node(id).value=String(v),edit=()=>node('price').listeners.input(),analysis=()=>node('analysis').children.map(x=>x.textContent).join(' ');let n=0;
function check(name,fn){fn();n++;console.log('PASS '+name)}
function cleared(){assert.equal(node('costs').children.length,0);assert.equal(node('analysis').children.length,0)}
check('independent closed-form reference',()=>assert(Math.abs(run('mortgagePayment(350000,6.5,30)')-2212.23808222537306216)<1e-9));
check('default all-in scenario',()=>{assert.match(node('answer').textContent,/budget: \$3,678 .*interest: \$2,528/);assert.match(analysis(),/\$115,000/);assert.match(analysis(),/34.8%/);assert.equal(node('costs').children.length,6)});
check('live input zero rate',()=>{set('price',120000);set('down',0);set('rate',0);set('years',10);edit();assert.match(node('answer').textContent,/interest: \$1,000/)});
check('tiny positive rate',()=>{set('rate','0.00000000000001');edit();assert.match(node('answer').textContent,/interest: \$1,000/)});
check('independent all-in cost components',()=>{set('tax',1200);set('insurance',600);set('hoa',40);set('pmi',30);set('maintenance',1);edit();assert.match(node('answer').textContent,/budget: \$1,320/)});
for(const [id,value] of [['price',''],['years',0],['price',-1],['down',101],['rate',31]])check('invalid '+id+'='+value+' clears outputs',()=>{const prev=node(id).value;set(id,value);edit();cleared();set(id,prev);edit()});
check('empty field explicit error',()=>{set('price','');edit();assert.equal(node('answer').textContent,'Please enter every required input.');set('price',240000);edit();assert.match(node('answer').textContent,/interest: \$2,000/)});
check('zero principal supported',()=>{set('down',100);edit();assert.match(node('answer').textContent,/interest: \$0/);set('down',0)});
check('zero income gives explanation',()=>{set('income',0);node('calculate').listeners.click();assert.match(analysis(),/Enter monthly income/);assert.doesNotMatch(analysis(),/NaN|Infinity/)});
check('overflow clears scenario',()=>{set('price','1e308');set('hoa','1e308');edit();assert.match(node('answer').textContent,/supported numeric range/);cleared()});
check('change event restores valid result',()=>{set('price',240000);set('hoa',40);node('price').listeners.change();assert.match(node('answer').textContent,/interest: \$2,000/)});
check('methodology and independent resources preserved',()=>{for(const x of ['mortgage-methodology','consumerfinance.gov/owning-a-home/compare/','hud.gov/buying/localbuying','annualcreditreport.com/','home-renovation.html'])assert(html.includes(x))});
check('polite result and self-canonical',()=>{assert(html.includes('role="status" aria-live="polite"'));assert(html.includes('rel="canonical" href="https://compoundyourfuture.com/home-mortgage.html"'))});
console.log(`${n} mortgage scenario/content/live-input checks passed. Mock DOM only, not browser rendering.`);
