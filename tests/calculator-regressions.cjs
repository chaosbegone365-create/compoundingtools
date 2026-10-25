'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
function context(file){
 const html=fs.readFileSync(path.join(root,file),'utf8'),elements=new Map(),inputs=[];
 function node(){return {value:'',textContent:'',innerHTML:'',children:[],addEventListener(){},setAttribute(){},appendChild(child){this.children.push(child)},replaceChildren(...children){this.children=children},scrollIntoView(){}};}
 const el=id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id)};
 for(const match of html.matchAll(/<(input|select)\b[^>]*>/g)){const id=match[0].match(/id="([^"]+)"/)?.[1];if(id){el(id).value=match[0].match(/value="([^"]*)"/)?.[1]||'';if(match[1]==='input')inputs.push(el(id));}}
 el('kind').value='call';
 const sandbox={document:{getElementById:el,querySelectorAll:()=>inputs,querySelector:()=>el('query'),createElement:node},Intl,Number,Math,Date,console,location:{},alert(){}};
 vm.createContext(sandbox);
 for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){if(!script[0].includes('application/ld+json'))vm.runInContext(script[1],sandbox);}
 return {el,run:code=>vm.runInContext(code,sandbox),set:(id,value)=>el(id).value=String(value)};
}
let passed=0;function check(name,fn){fn();passed++;console.log('PASS '+name)}
const mortgage=context('home-mortgage.html');
check('mortgage normal independent closed-form',()=>assert(Math.abs(mortgage.run('mortgagePayment(100000,6,30)')-599.5505251527569)<1e-8));
check('mortgage zero interest',()=>assert.equal(mortgage.run('mortgagePayment(120000,0,10)'),1000));
check('mortgage tiny positive interest',()=>assert(Math.abs(mortgage.run('mortgagePayment(120000,1e-14,10)')-1000)<1e-8));
check('mortgage zero loan',()=>assert.equal(mortgage.run('mortgagePayment(0,6,30)'),0));
for(const expression of ['mortgagePayment(1000,6,0)','mortgagePayment(1000,-1,10)','mortgagePayment(Infinity,6,30)','mortgagePayment(1e308,1e308,1)'])check('mortgage invalid/range '+expression,()=>assert(Number.isNaN(mortgage.run(expression))));
check('mortgage blank rejected',()=>{mortgage.set('f0','');assert.match(mortgage.run('compute()'),/required/)});
const options=context('options.html');
check('options ordinary call payoff',()=>assert.equal(options.el('profit').textContent,'$400.00'));
check('Black Scholes independent reference',()=>assert(Math.abs(options.run("bs('call',100,100,1,.2,.05,0)")-10.450583572185565)<.0001));
check('put call parity',()=>assert(Math.abs(options.run("bs('call',100,110,2,.3,.04,.02)-bs('put',100,110,2,.3,.04,.02)")-(100*Math.exp(-.04)-110*Math.exp(-.08)))<1e-6));
check('put no attainable breakeven',()=>{options.set('kind','put');options.set('strike',5);options.set('premium',10);options.run('update()');assert.equal(options.el('breakeven').textContent,'Not attainable');assert.equal(options.el('risk').textContent,'$1,000.00')});
check('put equality breakeven remains zero',()=>{options.set('premium',5);options.run('update()');assert.equal(options.el('breakeven').textContent,'$0.00')});
check('put normal breakeven',()=>{options.set('strike',100);options.set('premium',6);options.run('update()');assert.equal(options.el('breakeven').textContent,'$94.00')});
for(const [id,value] of [['contracts','1.5'],['multiplier','1.5'],['contracts',''],['premium',''],['contracts','1e20']]){
 check('consistent position validation '+id+'='+value,()=>{const c=context('options.html');c.set(id,value);c.run('update(); updateSchedule()');assert.equal(c.el('profit').textContent,'Check inputs');assert.equal(c.el('schedule').children.length,0);assert.match(c.el('scheduleStatus').textContent,/valid/)});
}
for(const [id,value] of [['current',''],['iv',''],['rf',''],['dividend',''],['rf','abc'],['dividend','-1'],['rf','-1e308'],['expiry','2027-02-30']]){
 check('schedule invalid/range '+id+'='+value,()=>{const c=context('options.html');c.set(id,value);c.run('updateSchedule()');assert.equal(c.el('schedule').children.length,0);assert(!c.el('scheduleStatus').textContent.includes('NaN'))});
}
check('ordinary schedule populated',()=>assert.equal(context('options.html').el('schedule').children.length,2));
const home=context('index.html');
check('growth zero rate',()=>assert.equal(home.run('project(10000,100,1,0)'),11200));
check('growth independent compound calculation',()=>assert(Math.abs(home.run('project(10000,100,1,12)')-(10000*1.01**12+100*(1.01**12-1)/.01))<1e-7));
for(const [fn,ids,result] of [['calcBonus',{salary:'1e308',bonusRate:'1e308',payout:100},'bonusResult'],['calcGrowth',{initial:'1e308',monthly:'1e308',years:100,rate:100},'growthResult'],['calcRetire',{age:20,retireAge:100,saved:'1e308',retMonthly:'1e308',retRate:100,inflation:2},'retResult']]){
 check(fn+' finite input overflow rejected',()=>{for(const [id,value] of Object.entries(ids))home.set(id,value);home.run(fn+'()');assert.match(home.el(result).textContent,/numeric range/)});
}
console.log(`${passed} focused numerical/validation checks passed. Mocked DOM, not browser QA.`);
