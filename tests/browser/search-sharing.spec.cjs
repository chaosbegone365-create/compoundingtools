const { test, expect } = require('@playwright/test');
test.beforeEach(async ({page}) => {
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173') ? route.continue() : route.abort());
  await page.goto('/');
});
test('search synonyms, multiword intent, real destinations and no matches', async ({page}) => {
  const input = page.locator('#site-search');
  for (const [query, href] of [['options investing','options.html'], ['education','family-school-costs.html'], ['school','family-school-costs.html'], ['grocery','health-meal-planner.html'], ['renovation','home-renovation.html']]) {
    await input.fill(query);
    await expect(page.locator('#tool-search-results a').first()).toHaveAttribute('href',href);
  }
  await input.fill('zzzzxyz');
  await expect(page.locator('#tool-search-status')).toContainText('No matching');
  await expect(page.locator('#tool-search-results a')).toHaveCount(0);
  await input.fill(''); await page.locator('#tool-search-form button').click();
  await expect(page.locator('#tool-search-results a')).toHaveCount(await page.evaluate(() => window.CYFToolSearch.catalog.length));
});
test('keyboard navigation, dismissal, reopening and Enter follow the selected link', async ({page}) => {
  const input=page.locator('#site-search'); await input.fill('options investing');
  await input.press('ArrowDown'); await expect(page.locator('#tool-search-results a').first()).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
  await expect(page.locator('#tool-search-results a').first()).toBeFocused();
  await page.keyboard.press('Escape'); await expect(input).toBeFocused(); await expect(page.locator('#tool-search-panel')).toBeHidden();
  await input.press('ArrowDown'); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/options\.html$/);
});
test('native share is gesture-only and excludes input state, URL query and fragment', async ({page}) => {
  await page.evaluate(() => { window.shared = []; Object.defineProperty(navigator,'share',{configurable:true,value:async d=>window.shared.push(d)}); history.replaceState({},'', '/?salary=98765#private'); });
  await page.locator('#site-search').fill('my child private information');
  await expect.poll(()=>page.evaluate(()=>window.shared.length)).toBe(0);
  await page.locator('[data-share-tool]').click();
  const data = await page.evaluate(()=>window.shared[0]);
  expect(data).toEqual({title:'Compound Your Future',text:'Explore free calculators from Compound Your Future.',url:'https://compoundyourfuture.com/'});
});
test('cancel does not trigger clipboard; unsupported share copies canonical', async ({page}) => {
  await page.evaluate(() => {
    window.copies=[];
    Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Canceled','AbortError')}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>window.copies.push(t)}});
  });
  await page.locator('[data-share-tool]').click(); await expect(page.locator('[data-share-status]')).toContainText('canceled');
  expect(await page.evaluate(()=>window.copies)).toEqual([]);
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:undefined}));
  await page.locator('[data-share-tool]').click(); expect(await page.evaluate(()=>window.copies)).toEqual(['https://compoundyourfuture.com/']);
});
test('manual fallback and small-screen layout', async ({page}) => {
  await page.evaluate(() => { Object.defineProperty(navigator,'share',{value:undefined,configurable:true}); Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true}); });
  await page.locator('[data-share-tool]').click();
  await expect(page.locator('[data-share-link]')).toHaveValue('https://compoundyourfuture.com/');
  await expect(page.locator('[data-share-link]')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
});
