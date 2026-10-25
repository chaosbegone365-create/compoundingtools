/* Integrated catalog, navigation and release boundaries; no browser/network. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {catalog,search} = require('../assets/tool-search.js');
const {render} = require('./integrate-sidebar.cjs');
const {canonicalURL} = require('../assets/share-tools.js');
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const route='home-renovation-quotes.html';
const html=fs.readFileSync(route,'utf8');
const hub=fs.readFileSync('home.html','utf8');
const tool=catalog.find(t=>t.id==='renovation-quotes');
ok(tool && tool.category==='Home' && tool.href===route,'one authoritative Home route');
ok(catalog.filter(t=>t.id==='renovation-quotes').length===1,'one new catalog ID');
ok(catalog.filter(t=>t.href===route).length===1,'one new catalog route');
ok(new Set(catalog.map(t=>t.id)).size===catalog.length,'unique catalog IDs');
ok(new Set(catalog.map(t=>t.href)).size===catalog.length,'unique catalog destinations');
ok(tool.name==='Renovation quote & preference comparison','descriptive tool name');
ok(tool.description.includes('subjective preferences') && tool.description.includes('hard budget'),'qualified preference and budget description');
for(const query of ['renovation quotes','material quote','aesthetics durability','hard project cap'])ok(search(query)[0].id===tool.id,'intent reaches new tool: '+query);
ok(search('renovation')[0].id==='renovation','existing broad renovation destination preserved');
ok(catalog.some(t=>t.id==='renovation' && t.href==='home-renovation.html'),'existing renovation tool retained');
const tiles=hub.match(/<div class="tiles">([\s\S]*?)<\/div><\/main>/)[1];
ok((tiles.match(/href="home-renovation-quotes.html"/g)||[]).length===1,'single new hub tile');
ok((tiles.match(/href="home-renovation.html"/g)||[]).length===1,'single existing hub tile');
ok(tiles.includes('Compare your material quotes and your own preference scores without relaxing your hard project budget.'),'hub states comparison and hard cap');
ok(tiles.indexOf('href="home-renovation.html"')<tiles.indexOf('href="'+route+'"'),'existing and new renovation tools adjacent in hub order');
for(const page of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){
 const content=fs.readFileSync(page,'utf8');
 const block=content.match(/<!-- cyf-sidebar:start -->[\s\S]*?<!-- cyf-sidebar:end -->/);
 ok(block && block[0]===render(page),page+' navigation matches authoritative catalog exactly');
 ok((block[0].match(/href="home-renovation-quotes.html"/g)||[]).length===1,page+' one new sidebar link');
}
ok(html.includes('<meta name="robots" content="index,follow">'),'released tool remains index-follow');
ok(html.includes('Fictional examples, not retail prices or product ratings.'),'fictional example disclosure');
ok(fs.readFileSync('sitemap.xml','utf8').includes(route),'released tool in sitemap');
ok(!html.includes('Draft calculator.') && !tiles.includes('Draft:'),'released tool has no draft labels');
ok(html.includes('<link rel="canonical" href="https://compoundyourfuture.com/'+route+'">'),'one clean canonical route');
ok(canonicalURL({querySelector:()=>({href:'https://compoundyourfuture.com/'+route+'?budget=98765#private'})})==='https://compoundyourfuture.com/'+route,'shared helper drops state from canonical');
ok(html.includes('assets/share-tools.js') && html.includes('data-share-tool'),'shared gesture-only sharing asset wired');
ok(html.includes('There are no purchase or affiliate links in this calculator.'),'no-retailer disclosure retained');
const main=html.match(/<main\b[\s\S]*?<\/main>/)[0];
ok(!/href=["'](?:https?:)?\/\//i.test(main),'no external retail or recommendation links');
ok(html.includes('Durability / longevity is your assessment, not a prediction of years of life.'),'subjective lifespan boundary retained');
for(const asset of ['assets/renovation-quotes-model.js','assets/renovation-quotes-ui.js']){
 const code=fs.readFileSync(asset,'utf8');
 ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage)\b/.test(code),asset+' no provider calls or persistence');
}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
for(const test of ['tests/renovation-quotes.cjs','tests/renovation-integration.cjs'])ok(pkg.scripts['test:static'].split(' && ').filter(c=>c==='node '+test).length===1,test+' in aggregate once');
console.log(`PASS: ${checks} renovation integration checks; released indexing, discovery, exact catalog navigation, clean sharing and scope boundaries.`);
