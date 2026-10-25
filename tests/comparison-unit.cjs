const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname,'..','compare-performance.html'),'utf8');
const elements = new Map();
let drawCalls = 0, downloaded = false, blob;
function element(id) {
  if (elements.has(id)) return elements.get(id);
  const classes = new Set(id === 'output' ? ['hidden'] : []);
  const node = {textContent:'', className:'', value:id === 'benchmarkSelect' ? 'SPY' : '', disabled:false, listeners:{},
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
    addEventListener(type,fn){this.listeners[type]=fn}, getBoundingClientRect:()=>({width:600,height:340}),setAttribute(){},
    getContext:()=>new Proxy({}, {get:()=>()=>{drawCalls++},set:()=>true}),
    click(){downloaded = true}, remove(){}};
  elements.set(id,node); return node;
}
const fixture = {updated:'2026-10-01',series:{SPY:[['2025-01-02',100],['2025-01-03',105],['2025-01-06',110]], QQQ:[['2025-01-02',100],['2025-01-03',110],['2025-01-06',120]]},metadata:{SPY:{fetched_at:'2026-09-30T00:00:00Z',status:'cached'}}};
const sandbox={document:{getElementById:element,createElement:()=>element('anchor'),body:{appendChild(){}}}, window:{devicePixelRatio:1,addEventListener(){}}, fetch:async()=>({ok:true,json:async()=>fixture}), URL:{createObjectURL:b=>{blob=b;return'blob:test'},revokeObjectURL(){}}, Blob, setTimeout:fn=>fn(), console};
vm.createContext(sandbox);
assert.equal((html.match(/<\/html>/g)||[]).length,1);
vm.runInContext(html.split('<script>')[1].split('</script>')[0],sandbox);
const run = code => vm.runInContext(code,sandbox);
const file = (text,size=1)=>({name:'test.csv',size,text:async()=>text});
async function upload(text,size) {sandbox.testFile=file(text,size); await run('receive(testFile)');}
(async()=>{
 await new Promise(setImmediate);
 assert.ok(element('benchmarkStatus').textContent.includes('2026-09-30T00:00:00Z (cached'));
 assert.ok(element('benchmarkStatus').textContent.includes('last price observation 2025-01-06'));
 for (const metadata of [null, undefined, {}, {SPY:{fetched_at:null,status:'cached'}}]) {
  fixture.metadata=metadata;run('setBenchmark()');
  assert.ok(element('benchmarkStatus').textContent.includes('last retrieved unknown'));
  assert.ok(!element('benchmarkStatus').textContent.includes('last retrieved 2026-10-01'));
 }
 assert.ok(element('benchmarkStatus').textContent.includes('(cached; latest refresh unavailable)'));
 fixture.metadata={SPY:{fetched_at:'2026-10-01T00:00:00Z',status:'fresh'}};run('setBenchmark()');
 assert.ok(element('benchmarkStatus').textContent.includes('last price observation 2025-01-06 · last retrieved 2026-10-01T00:00:00Z'));
 assert.ok(!element('benchmarkStatus').textContent.includes('(cached'));
 assert.equal(run('validDate("2025-02-30")'),false);
 assert.equal(run('validDate("2024-02-29")'),true);
 await upload('date,value\n2025-01-02,10000\n2025-01-03,11000\n2025-01-06,12500');
 assert.equal(element('portfolioReturn').textContent,'+25.00%');assert.equal(element('benchmarkReturn').textContent,'+10.00%');assert.equal(element('difference').textContent,'+15.00 pp');assert.ok(drawCalls>0);assert.equal(run('state.rows.length'),3);
 element('benchmarkSelect').value='QQQ';run('setBenchmark()');assert.equal(element('benchmarkReturn').textContent,'+20.00%');
 element('download').listeners.click(); assert.ok(downloaded);assert.ok((await blob.text()).includes('2025-01-06,12500.0000,12000.0000'));
 element('benchmarkSelect').value='IWM';run('setBenchmark()');assert.equal(run('state.rows.length'),0);assert.ok(element('output').classList.contains('hidden'));assert.ok(element('download').disabled);
 element('benchmarkSelect').value='SPY';run('setBenchmark()');
 await upload('"Date","Portfolio Value"\n2025-01-02,"$10,000"\n2025-01-06,"$11,000"');assert.equal(element('portfolioReturn').textContent,'+10.00%');
 for(const text of ['date,value\n2025-02-30,100\n2025-03-03,110','date,value\n2025-01-02,100\n2025-01-02,110','date,value\n2025-01-02,100\n2025-01-06,','date,value\n2025-01-02,100\n2025-01-06,"110']){
  await upload(text);assert.ok(element('output').classList.contains('hidden'));assert.equal(run('state.rows.length'),0);assert.equal(element('message').className,'error');
 }
 await upload('date,value\n2025-01-02,100\n2025-01-06,110',3000001);assert.ok(element('message').textContent.includes('3 MB'));assert.equal(run('state.portfolio'),null);
 await upload('date,value\n2024-01-02,100\n2024-01-03,110');assert.ok(element('message').textContent.includes('Not enough matching'));
 await upload('date,value\n2025-01-02,100\n2025-01-04,105\n2025-01-06,110');assert.ok(element('message').textContent.includes('1 portfolio date(s) excluded'));
 // Earlier reads cannot overwrite the newest uploaded file.
 let resolve; sandbox.testFile={name:'slow.csv',size:1,text:()=>new Promise(r=>resolve=r)};const slow=run('receive(testFile)');
 await upload('date,value\n2025-01-02,100\n2025-01-06,120');resolve('date,value\n2025-01-02,100\n2025-01-06,130');await slow;assert.equal(element('portfolioReturn').textContent,'+20.00%');
 sandbox.fetch=async()=>({ok:false});await run('loadBenchmarks()');assert.ok(element('benchmarkStatus').textContent.includes('unavailable'));assert.equal(run('state.rows.length'),0);
 assert.throws(()=>run("benchmarkMap([['2025-02-30',10],['2025-03-01',12]])"));
 assert.throws(()=>run("benchmarkMap([['2025-01-02',10],['2025-01-02',12]])"));
 console.log('PASS: comparison cases: syntax/markup, per-series cached/unknown freshness, legacy/null metadata, retrieval versus last price observation, calendar dates, upload/normalization, chart calls, ETF switch, CSV download, stale clearing, quoted currency, malformed/duplicate/missing data, size limit, overlap, omissions, upload race, unavailable/malformed benchmarks. Synthetic fixtures; mocked DOM/canvas, not browser QA.');
})().catch(e=>{console.error(e);process.exit(1)});
