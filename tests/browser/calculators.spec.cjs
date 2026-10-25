const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const ORIGIN = 'http://127.0.0.1:4173';
const FIXTURE = {
  updated: '2025-01-06T00:00:00Z',
  series: {
    SPY: [['2025-01-02',100],['2025-01-03',105],['2025-01-06',110]],
    QQQ: [['2025-01-02',100],['2025-01-03',110],['2025-01-06',120]]
  }
}; // Synthetic only. Never written to site/data or described as market history.
const csv = 'date,value\n2025-01-02,10000\n2025-01-03,11000\n2025-01-06,12500';
let pageErrors;
test.beforeEach(async ({ page, context }) => {
  pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await context.route('**/*', route => new URL(route.request().url()).origin === ORIGIN ? route.continue() : route.abort());
});
test.afterEach(async () => { expect(pageErrors, 'No uncaught browser exceptions').toEqual([]); });
async function field(page, id, value) { await page.locator('#' + id).fill(value); }
async function upload(page, text) { await page.locator('#portfolioFile').setInputFiles({ name:'synthetic-test.csv', mimeType:'text/csv', buffer:Buffer.from(text) }); }

test('options: impossible put breakeven and fractional contracts clear results', async ({ page }) => {
  await page.goto('/options.html');
  await page.locator('#kind').selectOption('put');
  await field(page,'spot','0'); await field(page,'strike','5'); await field(page,'premium','10');
  await expect(page.locator('#breakeven')).toHaveText('Not attainable');
  await expect(page.locator('#profit')).toContainText('-$500');
  await field(page,'contracts','1.5');
  await expect(page.locator('#profit')).toHaveText('Check inputs');
  await expect(page.locator('#scheduleStatus')).toContainText('whole positive contract');
  await expect(page.locator('#schedule td')).toHaveCount(0);
  await field(page,'contracts','1');
  await expect(page.locator('#breakeven')).toHaveText('Not attainable');
});

test('mortgage: normal, tiny rate, zero rate, invalid and repeated live edits', async ({ page }) => {
  await page.goto('/home-mortgage.html');
  await expect(page.locator('#answer')).toContainText('principal and interest: $2,528');
  await field(page,'price','120000'); await field(page,'down','0');
  await field(page,'rate','0'); await field(page,'years','10');
  await expect(page.locator('#answer')).toContainText('principal and interest: $1,000');
  await field(page,'rate','0.00000000000001');
  await expect(page.locator('#answer')).toContainText('principal and interest: $1,000');
  await field(page,'price','');
  await expect(page.locator('#answer')).toHaveText('Please enter every required input.');
  await expect(page.locator('#answer')).not.toContainText('$1,000');
  await expect(page.locator('#costs')).toBeEmpty();
  await expect(page.locator('#analysis')).toBeEmpty();
  await field(page,'price','240000'); await field(page,'rate','0');
  await expect(page.locator('#answer')).toContainText('principal and interest: $2,000');
  await expect(page.locator('#price')).toBeVisible();
});

test('investment growth: zero-return arithmetic and overflow handling', async ({ page }) => {
  await page.goto('/');
  for (const [id,value] of Object.entries({initial:'10000',monthly:'100',years:'1',rate:'0'})) await field(page,id,value);
  await page.getByRole('button',{name:'Project growth',exact:true}).click();
  await expect(page.locator('#growthResult')).toContainText('$11,200');
  await field(page,'initial','1e308'); await field(page,'monthly','1e308'); await field(page,'years','100'); await field(page,'rate','100');
  await page.getByRole('button',{name:'Project growth',exact:true}).click();
  await expect(page.locator('#growthResult')).toContainText('supported numeric range');
  await expect(page.locator('#growthResult')).not.toContainText('∞');
});

test('comparison: upload, select, actual canvas pixels, download and invalid reset', async ({ page }) => {
  await page.route('**/data/benchmarks.json', route => route.fulfill({json:FIXTURE}));
  await page.goto('/compare-performance.html');
  await expect(page.locator('#benchmarkStatus')).toContainText('SPY');
  await upload(page,csv);
  await expect(page.locator('#portfolioReturn')).toHaveText('+25.00%');
  await expect(page.locator('#benchmarkReturn')).toHaveText('+10.00%');
  await expect(page.locator('#output')).toBeVisible();
  expect(await page.locator('#chart').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    return data.some((value,index) => index % 4 === 3 && value > 0);
  })).toBe(true);
  await page.locator('#benchmarkSelect').selectOption('QQQ');
  await expect(page.locator('#benchmarkReturn')).toHaveText('+20.00%');
  const downloading = page.waitForEvent('download'); await page.locator('#download').click();
  const download = await downloading;
  expect(await fs.readFile(await download.path(),'utf8')).toContain('2025-01-06,12500.0000,12000.0000');
  await page.locator('#benchmarkSelect').selectOption('IWM');
  await expect(page.locator('#output')).not.toBeVisible(); await expect(page.locator('#download')).toBeDisabled();
  await page.locator('#benchmarkSelect').selectOption('SPY');
  await expect(page.locator('#output')).toBeVisible();
  await upload(page,'date,value\n2025-02-30,100\n2025-03-03,110');
  await expect(page.locator('#message')).toContainText('Invalid date');
  await expect(page.locator('#output')).not.toBeVisible(); await expect(page.locator('#download')).toBeDisabled();
});

test('comparison: absent benchmark data is explicit, never invented', async ({ page }) => {
  await page.route('**/data/benchmarks.json', route => route.fulfill({status:404,body:'Not found'}));
  await page.goto('/compare-performance.html');
  await expect(page.locator('#benchmarkStatus')).toContainText('unavailable');
  await upload(page,csv);
  await expect(page.locator('#message')).toContainText('unavailable');
  await expect(page.locator('#output')).not.toBeVisible(); await expect(page.locator('#download')).toBeDisabled();
});

test('meal planner: manual quantities persist; invalid settings clear stale groceries', async ({ page }) => {
  await page.goto('/health-meal-planner.html');
  await expect(page.locator('#cards article')).toHaveCount(7);
  const quantity = page.locator('#shopping .grocery-row input[type=number]').first();
  const label = await quantity.getAttribute('aria-label');
  expect(label).toBeTruthy();
  await quantity.fill('99'); await quantity.press('Tab');
  await field(page,'budget','121'); await page.locator('#budget').press('Tab');
  await expect(page.getByLabel(label,{exact:true})).toHaveValue('99');
  await field(page,'budget','-1'); await page.locator('#budget').press('Tab');
  await expect(page.locator('#summary')).toContainText('valid');
  await expect(page.locator('#cards article')).toHaveCount(0);
  await expect(page.locator('#shopping .grocery-row')).toHaveCount(0);
  await expect(page.locator('#copy-list')).toBeDisabled(); await expect(page.locator('#download-list')).toBeDisabled();
  await field(page,'budget','120'); await page.locator('#budget').press('Tab');
  await expect(page.locator('#cards article')).toHaveCount(7);
  await field(page,'people','0'); await page.locator('#people').press('Tab');
  await expect(page.locator('#cards article')).toHaveCount(0);
  await expect(page.locator('#shopping .grocery-row')).toHaveCount(0);
});

test('meal planner: vegan swaps and accessible controls work without retailer actions', async ({ page }) => {
  await page.goto('/health-meal-planner.html');
  await page.locator('#diet').selectOption('vegan');
  await expect(page.locator('#cards article')).toHaveCount(7);
  await expect(page.locator('#cards')).not.toContainText(/Chicken|Turkey|Salmon|Egg and potato/i);
  const dinner = page.getByLabel('Choose dinner for day 1',{exact:true});
  const options = await dinner.locator('option').evaluateAll(items => items.map(x => x.value));
  expect(options.length).toBeGreaterThan(1);
  await dinner.selectOption(options[1]);
  await expect(dinner).toHaveValue(options[1]);
  await expect(page.locator('#shopping .grocery-row').first()).toBeVisible();
});

test('travel: recommendations, filters and keyboard details survive blocked map CDN', async ({ page }) => {
  await page.goto('/travel-budget.html');
  await expect(page.locator('#trip-map')).toContainText('Interactive map unavailable');
  await expect(page.locator('#results article')).toHaveCount(6);
  await page.locator('#region').selectOption('europe'); await page.locator('#discover').click();
  await expect(page.locator('#results article')).toHaveCount(2);
  await expect(page.locator('#results')).toContainText('Lisbon');
  await expect(page.locator('#results')).toContainText('Swiss Alps (Interlaken)');
  const summary = page.locator('#results details summary').first();
  await summary.focus(); await summary.press('Enter');
  await expect(page.locator('#results details').first()).toHaveAttribute('open','');
  await field(page,'people','0'); await page.locator('#discover').click();
  await expect(page.locator('#summary')).toContainText('valid');
  await expect(page.locator('#results article')).toHaveCount(0);
});

test('fitness costs: initialized cards, independent comparison, invalid clearing and recovery', async ({ page }) => {
  await page.goto('/health-fitness.html');
  await expect(page.locator('#options .tile')).toHaveCount(3);
  await expect(page.locator('#answer')).toContainText('Lowest estimated cost:');
  for (const [id,value] of Object.entries({gym:'50',joining:'0',travel:'0',home:'500',ongoing:'0',classprice:'20',weekly:'3',months:'12'})) await field(page,id,value);
  await page.locator('#compare').click();
  await expect(page.locator('#answer')).toContainText('Home equipment at $500 over 12 months');
  await expect(page.locator('#options')).toContainText('$600 total');
  await expect(page.locator('#options')).toContainText('$3,120 total');
  await field(page,'months',''); await page.locator('#compare').click();
  await expect(page.locator('#answer')).toContainText('Check inputs');
  await expect(page.locator('#options')).toBeEmpty();
  await expect(page.locator('#insight')).toBeEmpty();
  await field(page,'months','12'); await page.locator('#compare').click();
  await expect(page.locator('#options .tile')).toHaveCount(3);
});

test('workout schedule: initialized plan, settings update, invalid clearing and recovery', async ({ page }) => {
  await page.goto('/health-workout.html');
  await expect(page.locator('#plan article')).toHaveCount(7);
  await page.locator('#equipment').selectOption('dumbbells');
  await field(page,'days','4'); await field(page,'minutes','30');
  await page.locator('#generate').click();
  await expect(page.locator('#answer')).toContainText('4 scheduled workouts · 120 minutes');
  await expect(page.locator('#plan')).toContainText('Goblet squats');
  await field(page,'days','1'); await page.locator('#generate').click();
  await expect(page.locator('#answer')).toContainText('Enter 2–6 workout days');
  await expect(page.locator('#plan')).toBeEmpty();
  await expect(page.locator('#copy')).toBeDisabled();
  await field(page,'days','4'); await page.locator('#generate').click();
  await expect(page.locator('#plan article')).toHaveCount(7);
  await expect(page.locator('#copy')).toBeEnabled();
});

test('renovation: initialized budget, independent arithmetic, invalid clearing and recovery', async ({ page }) => {
  await page.goto('/home-renovation.html');
  await expect(page.locator('#details .tile')).toHaveCount(4);
  await expect(page.locator('#answer')).toContainText('Illustrative project budget:');
  for (const [id,value] of Object.entries({area:'100',materials:'10',labor:'20',permits:'500',contingency:'10',saved:'500',months:'10'})) await field(page,id,value);
  await page.locator('#run').click();
  await expect(page.locator('#answer')).toContainText('$3,850');
  await expect(page.locator('#answer')).toContainText('$335/month');
  await expect(page.locator('#answer')).toContainText('remaining $3,350');
  await field(page,'months','0'); await page.locator('#run').click();
  await expect(page.locator('#answer')).toContainText('Please enter valid project details.');
  await expect(page.locator('#details')).toBeEmpty();
  await field(page,'months','10'); await page.locator('#run').click();
  await expect(page.locator('#details .tile')).toHaveCount(4);
});
