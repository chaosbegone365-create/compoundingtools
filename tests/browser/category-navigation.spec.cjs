const {test,expect}=require('@playwright/test');
const {groups}=require('../integrate-sidebar.cjs');
test.beforeEach(async({page})=>{await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());});
for(const width of [1440,390])test(`seven readable category routes at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/index.html');
 const mobile=width<1200;
 const labels=mobile?page.locator('.cyf-category-shortcuts a'):page.locator('#cyf-sidebar summary');
 await expect(labels).toHaveCount(7);
 for(let i=0;i<7;i++){
  await expect(labels.nth(i)).toHaveText(groups[i][1]);await expect(labels.nth(i)).toBeVisible();
  const box=await labels.nth(i).boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(900);
  if(mobile)await expect(labels.nth(i)).toHaveAttribute('href',groups[i][2]);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 if(mobile){
  await expect(page.locator('#cyf-menu-toggle')).toHaveAttribute('aria-expanded','false');
  const search=await page.locator('#site-search').boundingBox();expect(search.y+search.height).toBeLessThanOrEqual(844);
  await page.locator('.cyf-category-shortcuts a[href="retirement.html"]').click();await expect(page).toHaveURL(/retirement.html$/);await expect(page.locator('main h1')).toHaveText('Retirement & Saving');
 }
});
test('all category destinations resolve without using a menu button',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const [,label,href] of groups){await page.goto('/index.html');await page.locator('.cyf-category-shortcuts a').filter({hasText:label}).click();await expect(page).toHaveURL(new RegExp('/'+href.replace('.','\\.')+'$'));await expect(page.locator('main h1')).toBeVisible();}
});
