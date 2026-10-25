const { test, expect } = require('@playwright/test');
const ORIGIN = 'http://127.0.0.1:4173';
// Only synthetic data, intercepted in-browser; no production data files changed.
const benchmark = { updated:'2025-01-06T00:00:00Z', series:{ SPY:[['2025-01-02',100],['2025-01-06',110]] } };
const pages = [
  { path:'/', controls:['#initial', 'button[onclick="calcGrowth()"]'] },
  { path:'/home-mortgage.html', controls:['#f0', '#calc button[type=submit]'] },
  // Options recalculates live and has no primary action button.
  { path:'/options.html', controls:['#current', '#kind'] },
  { path:'/compare-performance.html', controls:['#portfolioFile', '#download'], comparison:true },
  { path:'/health-meal-planner.html', controls:['#people', '#plan'] },
  { path:'/travel-budget.html', controls:['#budget', '#discover'] }
];
async function noDocumentOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  // One CSS pixel permits subpixel rounding, not actual horizontal page scrolling.
  expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
}
async function keyboardReach(page, selectors) {
  const remaining = new Set(selectors);
  // Actual sequential keyboard navigation, not locator.focus()/scrollIntoView().
  // The bound covers homepage navigation while detecting traps/unreachable controls.
  for (let tabs = 0; tabs < 120 && remaining.size; tabs++) {
    await page.keyboard.press('Tab');
    for (const selector of [...remaining]) {
      const control = page.locator(selector);
      if (!await control.evaluate(el => el === document.activeElement)) continue;
      await expect(control).toBeFocused();
      try {
        await expect(control).toBeInViewport({ ratio:1 });
      } catch (error) {
        const geometry = await control.evaluate(el => ({
          rect: el.getBoundingClientRect().toJSON(),
          innerWidth, innerHeight, scrollX, scrollY,
          visualViewport: window.visualViewport ? {
            width: visualViewport.width, height: visualViewport.height,
            offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop
          } : null
        }));
        console.error('Focused control geometry:', page.url(), selector, JSON.stringify(geometry));
        throw error;
      }
      const box = await control.boundingBox();
      const viewport = page.viewportSize();
      expect(box, `${selector} must have rendered bounds`).not.toBeNull();
      expect(box.x, `${selector} left edge`).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width, `${selector} right edge`).toBeLessThanOrEqual(viewport.width + 1);
      remaining.delete(selector);
    }
  }
  expect([...remaining], 'Controls unreachable by ordinary Tab navigation').toEqual([]);
}

test('key pages: no page-wide horizontal overflow and primary controls keyboard reachable', async ({ page, context }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => new URL(route.request().url()).origin === ORIGIN ? route.continue() : route.abort());
  await page.route('**/data/benchmarks.json', route => route.fulfill({ json:benchmark }));
  for (const item of pages) {
    await test.step(item.path, async () => {
      await page.goto(item.path);
      if (item.comparison) {
        await page.locator('#portfolioFile').setInputFiles({ name:'synthetic-layout.csv', mimeType:'text/csv', buffer:Buffer.from('date,value\n2025-01-02,10000\n2025-01-06,12500') });
        await expect(page.locator('#portfolioReturn')).toHaveText('+25.00%');
        await expect(page.locator('#download')).toBeEnabled();
      }
      await noDocumentOverflow(page);
      await keyboardReach(page, item.controls);
      await noDocumentOverflow(page);
    });
  }
  expect(errors, 'No uncaught browser exceptions').toEqual([]);
});
