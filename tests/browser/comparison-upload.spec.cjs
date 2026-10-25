const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const ORIGIN = 'http://127.0.0.1:4173';
// Fictional prices only. These fixtures are never saved into the published dataset.
const BUILTIN = { series:{ SPY:[['2025-01-02',100],['2025-01-03',105],['2025-01-06',110]] }, metadata:{SPY:{fetched_at:'2026-09-30T00:00:00Z',status:'cached'}} };
const PORTFOLIO = 'date,value\n2025-01-08,10000\n2025-01-06,100\n2025-01-03,90\n2025-01-02,80\n2025-01-01,1000';
const CUSTOM = 'date,value\n2025-01-06,180\n2025-01-02,240\n2025-01-03,300\n2025-01-07,200';
let errors, requests;
test.beforeEach(async ({ page, context }) => {
  errors=[]; requests=[];
  page.on('pageerror', error=>errors.push(error.message));
  page.on('request', request=>requests.push({url:request.url(),method:request.method(),body:request.postData()}));
  await context.route('**/*', route=>new URL(route.request().url()).origin===ORIGIN ? route.continue() : route.abort());
});
test.afterEach(async ()=>{
  expect(errors, 'No uncaught browser exceptions').toEqual([]);
  expect(requests.every(request=>new URL(request.url).origin===ORIGIN && request.method==='GET' && request.body===null), 'Only local read-only site requests; no provider or upload requests').toBe(true);
});
async function upload(page, id, text, name='synthetic.csv') {
  await page.locator('#'+id).setInputFiles({name,mimeType:'text/csv',buffer:Buffer.from(text)});
}
async function missing(page) {
  await page.route('**/data/benchmarks.json', route=>route.fulfill({status:404,body:'Not found'}));
  await page.goto('/compare-performance.html');
  await expect(page.locator('#benchmarkStatus')).toContainText('unavailable');
}
async function customMode(page) { await page.locator('#benchmarkSource').selectOption('upload'); }
async function ready(page) {
  await upload(page,'portfolioFile',PORTFOLIO);
  await customMode(page);
  await upload(page,'benchmarkFile',CUSTOM);
  await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
}
async function cleared(page) {
  await expect(page.locator('#output')).toBeHidden();
  await expect(page.locator('#download')).toBeDisabled();
  await expect(page.locator('#portfolioReturn')).toHaveText('—');
  await expect(page.locator('#resultSource')).toBeEmpty();
  await expect(page.locator('#detail')).toBeEmpty();
  await expect(page.locator('#chart')).toHaveAttribute('aria-label','No comparison available');
  expect(await page.locator('#chart').evaluate(canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3 && value>0)), 'No stale chart pixels').toBe(false);
}
async function delayReads(page) {
  await page.addInitScript(()=>{
    const original=File.prototype.text;
    window.releaseReads={};
    File.prototype.text=function() {
      if (this.name.startsWith('delayed-')) return new Promise((resolve,reject)=>{
        window.releaseReads[this.name]=()=>original.call(this).then(resolve,reject);
      });
      if (this.name==='unreadable.csv') return Promise.reject(Error('Synthetic read interruption'));
      return original.call(this);
    };
  });
}

test('custom comparison works without a built-in file, with independent arithmetic, chart and safe export', async ({page})=>{
  await missing(page); await ready(page);
  // Independent endpoint math: 100/80−1 = 25%; 180/240−1 = −25%; difference = 50 pp.
  await expect(page.locator('#portfolioReturn')).toHaveText('+25.00%');
  await expect(page.locator('#difference')).toHaveText('+50.00 pp');
  await expect(page.locator('#period')).toHaveText('2025-01-02 to 2025-01-06 · 3 matching dates');
  await expect(page.locator('#message')).toContainText('2 portfolio date(s) excluded');
  await expect(page.locator('#benchmarkStatus')).toContainText('not independently verified');
  await expect(page.locator('#benchmarkStatus')).not.toContainText('last retrieved');
  await expect(page.locator('#resultSource')).toContainText('user-provided benchmark CSV · not independently verified');
  await expect(page.locator('#cashflowWarning')).toContainText('exclude deposits and withdrawals');
  await expect(page.locator('#detail')).toContainText('not verified total return');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
  expect(await page.locator('#chart').evaluate(canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3 && value>0))).toBe(true);
  const downloading=page.waitForEvent('download'); await page.locator('#download').click();
  const csv=await fs.readFile(await (await downloading).path(),'utf8');
  expect(csv).toBe('date,portfolio_normalized,user_provided_benchmark_not_verified_normalized\n2025-01-02,10000.0000,10000.0000\n2025-01-03,11250.0000,12500.0000\n2025-01-06,12500.0000,7500.0000');
  await page.locator('#clearBenchmark').focus(); await page.locator('#clearBenchmark').press('Enter');
  await cleared(page); await expect(page.locator('#benchmarkSource')).toHaveValue('upload');
  await expect(page.locator('#benchmarkFileStatus')).toHaveText('No benchmark file selected');
  await expect(page.locator('#benchmarkFile')).toHaveValue('');
  await upload(page,'benchmarkFile',CUSTOM); await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
});

test('explicit source selection keeps successful built-in metadata and user data separate', async ({page})=>{
  await page.route('**/data/benchmarks.json', route=>route.fulfill({json:BUILTIN}));
  await page.goto('/compare-performance.html'); await upload(page,'portfolioFile',PORTFOLIO);
  await expect(page.locator('#benchmarkReturn')).toHaveText('+10.00%');
  await expect(page.locator('#benchmarkStatus')).toContainText('last price observation 2025-01-06 · last retrieved 2026-09-30T00:00:00Z (cached; latest refresh unavailable)');
  await customMode(page); await cleared(page);
  await upload(page,'benchmarkFile',CUSTOM); await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
  await expect(page.locator('#builtinBenchmark')).toBeHidden();
  await page.locator('#benchmarkSource').selectOption('builtin');
  await expect(page.locator('#customBenchmark')).toBeHidden();
  await expect(page.locator('#benchmarkReturn')).toHaveText('+10.00%');
  await expect(page.locator('#resultSource')).toHaveText('Source: built-in SPY historical price dataset.');
  await page.locator('#benchmarkSelect').selectOption('IWM'); await cleared(page);
  await expect(page.locator('#benchmarkStatus')).toContainText('unavailable');
  await customMode(page); await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
  expect(requests.filter(request=>request.url.endsWith('/data/benchmarks.json'))).toHaveLength(1);
});

test('invalid, oversized, unmatched and repeated files clear stale results and recover', async ({page})=>{
  await missing(page); await ready(page);
  for (const text of ['date,value\n2025-02-30,100\n2025-03-03,110','date,value\n2025-01-02,100\n2025-01-02,110','date,value\n2025-01-02,100\n2025-01-06,','date,value\n2025-01-02,100\n2025-01-06,0','date,value\n2025-01-02,100\n2025-01-06,"110']) {
    await upload(page,'benchmarkFile',text,'same-name.csv'); await cleared(page);
    await expect(page.locator('#benchmarkFileStatus')).toHaveText('Invalid benchmark file');
    await upload(page,'benchmarkFile',CUSTOM,'same-name.csv'); await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
  }
  await upload(page,'benchmarkFile','x'.repeat(3000001)); await cleared(page);
  await expect(page.locator('#message')).toContainText('3 MB');
  await upload(page,'benchmarkFile','date,value\n2024-01-02,100\n2024-01-06,110'); await cleared(page);
  await expect(page.locator('#message')).toContainText('Not enough matching');
  await upload(page,'benchmarkFile',CUSTOM); await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
  await page.locator('#benchmarkFile').setInputFiles([]); // A canceled/empty selection preserves the current comparison.
  await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
  await upload(page,'portfolioFile','date,value\n2025-01-02,0\n2025-01-06,100'); await cleared(page);
  await upload(page,'portfolioFile',PORTFOLIO); await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
});

test('late and unreadable custom files cannot revive stale results after replacement, reset or source switch', async ({page})=>{
  await delayReads(page); await missing(page); await ready(page);
  await upload(page,'portfolioFile',PORTFOLIO,'delayed-portfolio.csv'); await cleared(page);
  await upload(page,'portfolioFile','date,value\n2025-01-02,100\n2025-01-06,130');
  await expect(page.locator('#portfolioReturn')).toHaveText('+30.00%');
  await page.evaluate(()=>window.releaseReads['delayed-portfolio.csv']());
  await expect(page.locator('#portfolioReturn')).toHaveText('+30.00%');
  await upload(page,'benchmarkFile',CUSTOM,'delayed-old.csv'); await cleared(page);
  await upload(page,'benchmarkFile','date,value\n2025-01-02,100\n2025-01-06,120');
  await expect(page.locator('#benchmarkReturn')).toHaveText('+20.00%');
  await page.evaluate(()=>window.releaseReads['delayed-old.csv']());
  await expect(page.locator('#benchmarkReturn')).toHaveText('+20.00%');
  for (const action of ['clear','switch']) {
    await upload(page,'benchmarkFile',CUSTOM,'delayed-'+action+'.csv'); await cleared(page);
    if (action==='clear') await page.locator('#clearBenchmark').click();
    else await page.locator('#benchmarkSource').selectOption('builtin');
    await page.evaluate(name=>window.releaseReads[name](),'delayed-'+action+'.csv');
    if (action==='switch') await customMode(page);
    await cleared(page); await expect(page.locator('#benchmarkFileStatus')).toHaveText('No benchmark file selected');
  }
  await upload(page,'benchmarkFile',CUSTOM); await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
  await upload(page,'benchmarkFile',CUSTOM,'unreadable.csv'); await cleared(page);
  await expect(page.locator('#message')).toContainText('Synthetic read interruption');
  await upload(page,'benchmarkFile',CUSTOM); await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
});

for (const status of [200,404]) test('late built-in '+status+' response does not replace a completed custom comparison', async ({page})=>{
  let release;
  await page.route('**/data/benchmarks.json', async route=>{
    await new Promise(resolve=>release=resolve);
    await route.fulfill(status===200 ? {json:BUILTIN} : {status:404,body:'Not found'});
  });
  await page.goto('/compare-performance.html'); await ready(page);
  const response=page.waitForResponse('**/data/benchmarks.json'); release(); await response;
  // The network response event precedes response.json()/application settlement.
  await page.waitForFunction(expected=>expected===200 ? state.benchmarks!==null : state.benchmarkError!==null,status);
  await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
  await expect(page.locator('#resultSource')).toContainText('user-provided benchmark CSV · not independently verified');
  await page.locator('#benchmarkSource').selectOption('builtin');
  if (status===200) await expect(page.locator('#benchmarkReturn')).toHaveText('+10.00%');
  else { await cleared(page); await expect(page.locator('#benchmarkStatus')).toContainText('unavailable'); }
});

test('uploaded files stay in memory and page sharing exposes only the canonical URL', async ({page})=>{
  await page.addInitScript(()=>{
    window.shared=[];
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>window.shared.push(data)});
  });
  await missing(page);
  const initialRequests=requests.length;
  await upload(page,'portfolioFile',PORTFOLIO,'private-portfolio-sentinel.csv');
  const privateName='private-benchmark-'+'x'.repeat(160)+'-<img>.csv';
  await customMode(page); await upload(page,'benchmarkFile',CUSTOM,privateName);
  await expect(page.locator('#benchmarkReturn')).toHaveText('-25.00%');
  await expect(page.locator('#benchmarkFileStatus')).toHaveText(privateName+' · 4 rows');
  expect(await page.locator('#benchmarkFileStatus').evaluate(node=>node.scrollWidth<=node.clientWidth+1), 'Long filenames wrap within their field').toBe(true);
  await expect(page.locator('#benchmarkFileStatus img')).toHaveCount(0);
  await page.locator('[data-share-tool]').click();
  await expect(page.locator('[data-share-status]')).toHaveText('Share dialog completed.');
  expect(await page.evaluate(()=>window.shared)).toEqual([{title:'Compound Your Future',text:'Explore free calculators from Compound Your Future.',url:'https://compoundyourfuture.com/compare-performance.html'}]);
  expect(page.url()).toBe(ORIGIN+'/compare-performance.html');
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
  expect(requests).toHaveLength(initialRequests);
  expect(JSON.stringify(requests)).not.toMatch(/private-|10000|12500|7500/);
  await page.reload(); await expect(page.locator('#benchmarkStatus')).toContainText('unavailable');
  await cleared(page); await expect(page.locator('#portfolioStatus')).toHaveText('No file selected');
  await customMode(page); await expect(page.locator('#benchmarkFileStatus')).toHaveText('No benchmark file selected');
});
