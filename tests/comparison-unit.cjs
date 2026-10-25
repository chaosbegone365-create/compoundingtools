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
    addEventListener(type,fn){this.listeners[type]=fn}, getBoundingClientRect:()=>({width:600,height:340}),attributes:{},setAttribute(name,value){this.attributes[name]=value},
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
async function custom(text,size) {sandbox.customFile=file(text,size); await run('receiveBenchmark(customFile)');}
function source(value) { element('benchmarkSource').value=value; element('benchmarkSource').listeners.change(); }
function cleared() {
 assert.ok(element('output').classList.contains('hidden')); assert.ok(element('download').disabled);
 assert.equal(run('state.rows.length'),0); assert.equal(element('portfolioReturn').textContent,'—');
 assert.equal(element('resultSource').textContent,''); assert.equal(element('detail').textContent,'');
 assert.equal(element('chart').attributes['aria-label'],'No comparison available');
}
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
 // User-provided files reuse the same parser but never become built-in/verified data.
 let networkRequests=0; sandbox.fetch=async url=>{ networkRequests++; assert.equal(url,'./data/benchmarks.json'); return {ok:false}; };
 source('upload'); cleared(); assert.equal(element('builtinBenchmark').hidden,true); assert.equal(element('customBenchmark').hidden,false);
 assert.ok(element('benchmarkStatus').textContent.includes('not independently verified'));
 // Independent arithmetic: intersecting endpoints are 80→100 and 240→180,
 // not the unmatched file endpoints. Returns are +25%, −25%, difference +50 pp.
 const local='date,value\n2025-01-06,180\n2025-01-02,240\n2025-01-03,300\n2025-01-07,200';
 await custom(local);
 await upload('date,value\n2025-01-08,10000\n2025-01-06,100\n2025-01-03,90\n2025-01-02,80\n2025-01-01,1000');
 assert.equal(element('portfolioReturn').textContent,'+25.00%'); assert.equal(element('benchmarkReturn').textContent,'-25.00%'); assert.equal(element('difference').textContent,'+50.00 pp');
 assert.deepEqual(JSON.parse(run('JSON.stringify(state.rows)')), [
  {date:'2025-01-02',portfolio:10000,benchmark:10000},
  {date:'2025-01-03',portfolio:11250,benchmark:12500},
  {date:'2025-01-06',portfolio:12500,benchmark:7500}
 ]);
 assert.ok(element('message').textContent.includes('2 portfolio date(s) excluded'));
 assert.ok(element('resultSource').textContent.includes('user-provided benchmark CSV · not independently verified'));
 assert.ok(element('detail').textContent.includes('exclude deposits and withdrawals'));
 assert.ok(element('detail').textContent.includes('not verified total return'));
 assert.ok(!element('benchmarkStatus').textContent.includes('last retrieved'));
 element('download').listeners.click(); const customCSV=await blob.text();
 assert.equal(customCSV.split('\n')[0],'date,portfolio_normalized,user_provided_benchmark_not_verified_normalized');
 assert.ok(customCSV.includes('2025-01-06,12500.0000,7500.0000')); assert.ok(!customCSV.includes('test.csv'));
 const ready=element('detail').textContent;
 await run('receiveBenchmark(null)'); assert.equal(element('detail').textContent,ready); // Picker cancellation.
 source('builtin'); cleared(); assert.ok(element('benchmarkStatus').textContent.includes('unavailable'));
 source('upload'); assert.equal(element('detail').textContent,ready); assert.equal(networkRequests,0);
 // Reset drops the completed custom source, file selection and output; it does not pick another source.
 element('benchmarkFile').value='old.csv'; element('clearBenchmark').listeners.click(); cleared();
 assert.equal(run('state.custom'),null); assert.equal(run('state.source'),'upload'); assert.equal(element('benchmarkFile').value,'');
 assert.equal(element('benchmarkFileStatus').textContent,'No benchmark file selected');
 for (const invalid of [
  'date,value\n2025-02-30,100\n2025-03-03,110', 'date,value\n2025-01-02,100\n2025-01-02,110',
  'date,value\n2025-01-02,100\n2025-01-06,', 'date,value\n2025-01-02,100\n2025-01-06,0',
  'date,value\n2025-01-02,100\n2025-01-06,-1', 'date,value\n2025-01-02,100\n2025-01-06,Infinity',
  'date,price\n2025-01-02,100\n2025-01-06,110', 'date,value\n2025-01-02,100',
  'date,value\n2025-01-02,100\n2025-01-06,"110'
 ]) {
  await custom(local); await custom(invalid); cleared(); assert.equal(run('state.custom'),null);
  assert.equal(element('message').className,'error'); assert.equal(element('benchmarkFileStatus').textContent,'Invalid benchmark file');
 }
 await custom(local,3000001); cleared(); assert.ok(element('message').textContent.includes('3 MB'));
 await custom(local,3000000); assert.equal(element('benchmarkReturn').textContent,'-25.00%');
 await custom('date,value\n2024-01-02,100\n2024-01-06,110'); cleared(); assert.ok(element('message').textContent.includes('Not enough matching'));
 await custom('date,value\n2025-01-02,1e-308\n2025-01-06,1e308'); cleared(); assert.ok(element('message').textContent.includes('supported numeric range'));
 await custom('"Date","Value"\n2025-01-02,"$1,000"\n2025-01-06,"$1,100"'); assert.equal(element('benchmarkReturn').textContent,'+10.00%');
 // The input listener clears value, so the same filename can be selected again.
 element('benchmarkFile').files=[file(local)]; element('benchmarkFile').value='same.csv';
 element('benchmarkFile').listeners.change(); await new Promise(setImmediate);
 assert.equal(element('benchmarkFile').value,''); assert.equal(element('benchmarkReturn').textContent,'-25.00%');
 let finishOld; sandbox.slowCustom={name:'old.csv',size:1,text:()=>new Promise(resolve=>finishOld=resolve)};
 let old=run('receiveBenchmark(slowCustom)'); cleared();
 await custom('date,value\n2025-01-02,100\n2025-01-06,120');
 finishOld(local); await old; assert.equal(element('benchmarkReturn').textContent,'+20.00%');
 old=run('receiveBenchmark(slowCustom)'); element('clearBenchmark').listeners.click(); finishOld(local); await old;
 cleared(); assert.equal(run('state.custom'),null);
 old=run('receiveBenchmark(slowCustom)'); source('builtin'); finishOld(local); await old;
 source('upload'); cleared(); assert.equal(run('state.custom'),null);
 // A superseded read rejection cannot delete a newer success.
 let rejectOld; sandbox.badRead={name:'bad.csv',size:1,text:()=>new Promise((_,reject)=>rejectOld=reject)};
 old=run('receiveBenchmark(badRead)'); await custom(local); rejectOld(Error('Read interrupted')); await old;
 assert.equal(element('benchmarkReturn').textContent,'-25.00%');
 sandbox.badRead={name:'bad.csv',size:1,text:async()=>{throw Error('Read interrupted')}};
 await run('receiveBenchmark(badRead)'); cleared(); assert.equal(element('message').textContent,'Read interrupted');
 // Late built-in success/failure cannot change a completed local comparison.
 for (const ok of [true,false]) {
  source('builtin'); let resolveFetch;
  sandbox.fetch=async url=>{assert.equal(url,'./data/benchmarks.json'); return new Promise(resolve=>resolveFetch=resolve)};
  const pending=run('loadBenchmarks()'); source('upload'); await custom(local);
  resolveFetch({ok,json:async()=>fixture}); await pending;
  assert.equal(element('benchmarkReturn').textContent,'-25.00%'); assert.ok(element('benchmarkStatus').textContent.startsWith('User-provided'));
  assert.ok(element('resultSource').textContent.includes('not independently verified'));
 }
 // Built-in metadata still works and never inherits an uploaded source.
 sandbox.fetch=async()=>({ok:true,json:async()=>fixture}); await run('loadBenchmarks()');
 source('builtin'); assert.equal(element('benchmarkReturn').textContent,'+10.00%');
 assert.ok(element('resultSource').textContent.includes('built-in SPY')); assert.ok(!element('benchmarkStatus').textContent.includes('User-provided'));
 source('upload'); assert.equal(element('benchmarkReturn').textContent,'-25.00%');
 assert.match(html, /name="robots" content="noindex,follow"/);
 assert.doesNotMatch(html.split('<script>')[1].split('</script>')[0], /localStorage|sessionStorage|sendBeacon|XMLHttpRequest|history\.|location\./);
 console.log('PASS: comparison cases: syntax/markup, per-series cached/unknown freshness, legacy/null metadata, retrieval versus last price observation, calendar dates, upload/normalization, chart calls, ETF switch, CSV download, stale clearing, quoted currency, malformed/duplicate/missing data, size limit, overlap, omissions, upload race, unavailable/malformed benchmarks. Plus custom-source independent overlap arithmetic, source attribution/export, canceled/repeated/invalid/oversized uploads, reset, source switching, rejected/read races and late built-in responses, cash-flow warnings and privacy boundaries. Synthetic fixtures; mocked DOM/canvas, not browser QA.');
})().catch(e=>{console.error(e);process.exit(1)});
