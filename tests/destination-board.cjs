'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/destination-board.js','utf8'),html=fs.readFileSync('index.html','utf8');
let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS destination board: '+name)};
function setup({reduced=false,missing=false,noMedia=false,legacy=false}={}){
 let id=0;const intervals=new Map(),timeouts=new Map(),events={},classes=()=>{const values=new Set();return{add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x)}};
 const nodes=['NEW YORK','ROME','TOKYO'].map(textContent=>({textContent,classList:classes(),offsetWidth:100}));
 const toggle={hidden:true,disabled:false,textContent:'Pause destinations',addEventListener:(name,fn)=>events[name]=fn};
 const motion={matches:reduced,[legacy?'addListener':'addEventListener']:(...args)=>events.motion=args.at(-1)};
 const board={querySelectorAll:()=>nodes,querySelector:()=>toggle};
 const document={hidden:false,querySelector:()=>missing?null:board,addEventListener:(name,fn)=>events[name]=fn};
 const window={setInterval:fn=>{intervals.set(++id,fn);return id},clearInterval:i=>intervals.delete(i),setTimeout:fn=>{timeouts.set(++id,fn);return id},clearTimeout:i=>timeouts.delete(i)};
 if(!noMedia)window.matchMedia=()=>motion;
 vm.runInNewContext(source,{document,window});
 const tick=()=>{for(const fn of [...intervals.values()])fn()};
 const flush=()=>{for(const [i,fn]of [...timeouts]){timeouts.delete(i);fn()}};
 return{nodes,toggle,motion,document,intervals,timeouts,tick,flush,click:()=>events.click(),media:value=>{motion.matches=value;events.motion()},visibility:hidden=>{document.hidden=hidden;events.visibilitychange()}};
}
check('browser-only initialization is isolated from core calculator VM',()=>{assert.match(html,/<script src="assets\/destination-board.js"><\/script>/);assert.doesNotThrow(()=>vm.runInNewContext(source,{}));});
check('missing optional board is safe',()=>assert.equal(setup({missing:true}).intervals.size,0));
check('explicit inspiration, disclosure and original affiliate URL retained',()=>{
 assert.match(html,/Destination inspiration—not live flight departures or availability\./);
 assert.match(html,/AFFILIATE LINK · WE MAY EARN A COMMISSION/);
 assert.match(html,/<a href="https:\/\/expedia\.com\/affiliate\/3DafBAM" target="_blank" rel="sponsored noopener noreferrer">Explore trips on Expedia ↗<\/a>/);
 assert.match(html,/data-board-toggle aria-controls="destination-board" hidden/);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|\.href\s*=|\.location/);
});
check('normal rotation updates destination labels only',()=>{const s=setup();assert.equal(s.intervals.size,1);s.tick();assert.equal(s.timeouts.size,3);assert(s.nodes.every(n=>n.classList.contains('flipping')));s.flush();assert.deepEqual(s.nodes.map(n=>n.textContent),['SAN DIEGO','COSTA RICA','QUEBEC CITY']);});
check('pause cancels pending updates and repeated toggles never duplicate timers',()=>{const s=setup();s.tick();s.click();assert.equal(s.intervals.size,0);assert.equal(s.timeouts.size,0);assert.equal(s.toggle.textContent,'Resume destinations');assert(s.nodes.every(n=>!n.classList.contains('flipping')));s.flush();assert.equal(s.nodes[0].textContent,'NEW YORK');for(let i=0;i<5;i++){s.click();assert.equal(s.intervals.size,1);s.click();assert.equal(s.intervals.size,0)}});
check('reduced motion starts static, exposes explanation, starts no timers',()=>{const s=setup({reduced:true});assert.equal(s.intervals.size,0);assert.equal(s.toggle.hidden,false);assert.equal(s.toggle.disabled,true);assert.match(s.toggle.textContent,/reduced motion/)});
check('live OS preference changes stop pending animation and resume safely',()=>{const s=setup();s.tick();s.media(true);assert.equal(s.intervals.size,0);assert.equal(s.timeouts.size,0);assert.equal(s.toggle.disabled,true);s.media(false);assert.equal(s.intervals.size,1);assert.equal(s.toggle.disabled,false)});
check('user pause survives OS preference changes and backgrounding',()=>{const s=setup();s.click();s.media(true);s.media(false);s.visibility(true);s.visibility(false);assert.equal(s.intervals.size,0);assert.equal(s.toggle.textContent,'Resume destinations')});
check('backgrounding cancels pending work; returning creates one timer',()=>{const s=setup();s.tick();s.visibility(true);assert.equal(s.intervals.size,0);assert.equal(s.timeouts.size,0);s.visibility(false);s.visibility(false);assert.equal(s.intervals.size,1)});
check('older media-query listener and no-matchMedia browsers stay operable',()=>{const legacy=setup({legacy:true});legacy.media(true);assert.equal(legacy.intervals.size,0);const old=setup({noMedia:true});assert.equal(old.intervals.size,1);old.click();assert.equal(old.intervals.size,0)});
console.log(`${passed} destination-board lifecycle/content checks passed. Mocked DOM, not browser or provider QA.`);
