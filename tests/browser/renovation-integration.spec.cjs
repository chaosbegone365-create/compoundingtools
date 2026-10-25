/* Full integrated journeys; execute only in the authorized loopback CI environment. */
const {test,expect}=require('@playwright/test');
let errors;
test.beforeEach(async({page,context})=>{
 errors=[];page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort());
});
test.afterEach(()=>expect(errors).toEqual([]));
const route='/home-renovation-quotes.html';
async function expectReady(page){
 await expect(page).toHaveURL(/home-renovation-quotes\.html$/);
 await expect(page.locator('#renovation-results')).toBeVisible();
 await expect(page.locator('#cyf-sidebar a[aria-current="page"]')).toHaveAttribute('href','home-renovation-quotes.html');
 await expect(page.locator('#cyf-sidebar details').filter({has:page.locator('a[href="home-renovation-quotes.html"]')})).toHaveAttribute('open','');
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','index,follow');
 expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
}
test('renovation search dismisses and reopens, keyboard enters released tool, and history recovers',async({page})=>{
 await page.goto('/');const input=page.locator('#site-search');
 await input.fill('renovation quotes');
 await expect(page.locator('#tool-search-results a').first()).toHaveAttribute('href','home-renovation-quotes.html');
 await input.press('ArrowDown');await page.keyboard.press('Escape');
 await expect(input).toBeFocused();await expect(page.locator('#tool-search-panel')).toBeHidden();
 await input.press('ArrowDown');await page.keyboard.press('Enter');await expectReady(page);
 await page.locator('#weight-aesthetics').fill('10');await page.locator('#weight-durability').fill('0');await page.locator('#weight-maintenance').fill('0');
 await expect(page.locator('#quote-outcome')).toContainText('A · Option A');
 await page.goBack();await expect(page).toHaveURL(/\/$/);
 await page.goForward();await expectReady(page);
 await page.getByRole('button',{name:'Reset fictional examples'}).click();
 await expect(page.locator('#quote-outcome')).toContainText('B · Option B');
 await expect(page.locator('#quote-rows tr')).toHaveCount(17);
});
test('Home hub preserves both renovation tools and returns to the released tool repeatedly',async({page})=>{
 await page.goto('/home.html');
 const old=page.locator('.tiles a[href="home-renovation.html"]');const comparison=page.locator('.tiles a[href="home-renovation-quotes.html"]');
 await expect(old).toHaveCount(1);await expect(comparison).toHaveCount(1);
 await expect(comparison).not.toContainText('Draft:');await expect(comparison).toContainText('Compare your material quotes');await expect(comparison).toContainText('hard project budget');
 await old.click();await expect(page).toHaveURL(/home-renovation\.html$/);
 await page.goBack();await comparison.click();await expectReady(page);
 await page.locator('main > a[href="home.html"]').click();await expect(page).toHaveURL(/home\.html$/);
 await comparison.click();await expectReady(page);
 await page.locator('#budget').fill('25000');await expect(page.locator('#quote-outcome')).toHaveText('No entered quote fits the hard cap.');
 await page.getByRole('button',{name:'Reset fictional examples'}).click();await expect(page.locator('#budget')).toHaveValue('30000');
});
test('sidebar reaches renovation from released travel tool, closes cleanly and survives history',async({page})=>{
 await page.goto('/travel-quote-tradeoffs.html');const mobile=page.viewportSize().width<1200;
 const toggle=page.locator('#cyf-menu-toggle');
 if(mobile){
  await toggle.click();await page.keyboard.press('Escape');await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.click();await page.locator('.cyf-menu-close').click();await expect(toggle).toBeFocused();
  await toggle.click();
 }
 await page.locator('#cyf-sidebar summary').filter({hasText:'Home & Big Purchases'}).click();
 await page.locator('#cyf-sidebar a[href="home-renovation-quotes.html"]').click();await expectReady(page);
 await page.goBack();await expect(page).toHaveURL(/travel-quote-tradeoffs\.html$/);
 await expect(toggle).toHaveAttribute('aria-expanded','false');expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
 await page.goForward();await expectReady(page);
 if(mobile){await toggle.click();await page.keyboard.press('Escape');await expect(toggle).toBeFocused();}
 await page.locator('#budget').fill('29554.79');await expect(page.locator('[data-quote="b"] .quote-fit')).toContainText('$0.01 over');
 expect(new URL(page.url()).search).toBe('');expect(new URL(page.url()).hash).toBe('');
});
