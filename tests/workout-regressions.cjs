'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../health-workout.html'),'utf8'),nodes={};
const make=()=>({value:'',textContent:'',children:[],listeners:{},append(...a){this.children.push(...a)},replaceChildren(...a){this.children=a},addEventListener(t,f){this.listeners[t]=f}}),node=id=>nodes[id]??=make();
for(const [id,value] of Object.entries({days:'4',minutes:'15',goal:'endurance',level:'beginner',equipment:'none'}))node(id).value=value;
let copied=[];const ctx={document:{getElementById:node,createElement:make},navigator:{clipboard:{writeText:async x=>copied.push(x)}}};vm.createContext(ctx);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
const run=s=>vm.runInContext(s,ctx);let count=0;function check(name,f){f();count++;console.log('PASS '+name)}
check('15-minute cardio fits selected budget',()=>{const cards=node('plan').children.filter(c=>c.children[0].textContent.includes('Cardio'));assert(cards.length>0);for(const c of cards){assert.match(c.children[1].children[0].textContent,/— 5 minutes$/);assert.match(c.children[1].children[1].textContent,/5 minutes each/)}assert.match(node('answer').textContent,/60 minutes per week time budget/)});
check('valid schedule enables copy',()=>{assert.equal(node('copy').disabled,false);assert(run('copyText').length>0)});
check('invalid schedule clears visible and copy state',()=>{node('days').value='';node('days').listeners.change();assert.equal(node('plan').children.length,0);assert.equal(run('copyText'),'');assert.equal(node('copy').disabled,true);node('copy').listeners.click();assert.equal(copied.length,0)});
check('valid edits restore copy and seven-day cards',()=>{node('days').value='3';node('days').listeners.change();assert.equal(node('plan').children.length,7);assert.equal(node('copy').disabled,false);assert(run('copyText').includes('Sunday'))});
check('CDC and educational caveat preserved',()=>{assert(html.includes('https://www.cdc.gov/physical-activity-basics/adults/index.html'));assert(html.includes('not individualized medical or exercise advice'))});
console.log(`${count} workout time-budget/copy-state checks passed. Mock DOM only.`);
