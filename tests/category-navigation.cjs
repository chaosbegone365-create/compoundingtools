const assert=require('node:assert/strict'),fs=require('node:fs');
const {groups}=require('./integrate-sidebar.cjs'),{catalog,search}=require('../assets/tool-search.js');
assert.deepEqual(groups.map(g=>g[1]),['Vacations','Investing','Retirement & Saving','Career & Compensation','Family & Parenting','Home & Big Purchases','Health & Fitness']);
for(const tool of catalog)assert.equal(groups.filter(g=>g[0]===tool.category).length,1,tool.id+' has one authoritative category');
for(const id of ['cash-goals','retirement'])assert.equal(catalog.find(t=>t.id===id).category,'Retirement');
const pages=fs.readdirSync('.').filter(x=>x.endsWith('.html'));
for(const page of pages){
 const html=fs.readFileSync(page,'utf8'),chips=html.match(/<nav class="cyf-category-shortcuts"[\s\S]*?<\/nav>/)[0];assert.equal((chips.match(/<a /g)||[]).length,7);
 assert.ok(html.indexOf('</header>')<html.indexOf(chips),'native header precedes chips');
 for(const [,label,href] of groups){assert.ok(chips.includes('href="'+href+'"'),page+' '+label);assert.ok(fs.existsSync(href));}
}
assert.equal(search('school')[0].id,'school-costs');assert.equal(search('college')[0].id,'college-paths');assert.equal(search('options investing')[0].id,'options');
assert.ok(fs.readFileSync('sitemap.xml','utf8').includes('https://compoundyourfuture.com/retirement.html'));
console.log(`PASS seven categories, one catalog, all ${pages.length} static navigation blocks, destinations, metadata and search smoke checks`);
