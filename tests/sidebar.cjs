const assert=require('node:assert/strict'),fs=require('node:fs');
const {catalog}=require('../assets/tool-search.js');
const {groups,render}=require('./integrate-sidebar.cjs');
let checks=0;function check(value,message){assert.ok(value,message);checks++;}
for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(file,'utf8'),block=html.match(/<!-- cyf-sidebar:start -->([\s\S]*?)<!-- cyf-sidebar:end -->/);
 check(block,file+' has navigation');check((html.match(/id="cyf-sidebar"/g)||[]).length===1,file+' unique nav');
 check((block[1].match(/<details/g)||[]).length===6,file+' six categories');
 check(html.includes('assets/site-sidebar.js')&&html.includes('assets/site-sidebar.css'),file+' assets');
 for(const [,href] of block[1].matchAll(/href="([^"]+)"/g)){
  const [target,fragment]=href.split('#');check(fs.existsSync(target),'exists '+href);
  if(fragment)check(fs.readFileSync(target,'utf8').includes('id="'+fragment+'"'),'anchor '+href);
 }
 for(const tool of catalog)check(block[1].includes('href="'+(tool.href.startsWith('#')?'index.html'+tool.href:tool.href)+'"'),file+' includes '+tool.id);
 const currents=[...block[1].matchAll(/href="([^"]+)" aria-current="page"/g)];check(currents.every(x=>x[1]===file),file+' correct current');
}
check(groups.length===6,'six groups');
check(render('home-mortgage.html').includes('<details open><summary>Home &amp; renovation'),'active category expanded');
console.log(`PASS: ${checks} sidebar catalog, route, fragment, markup and current-page assertions`);
