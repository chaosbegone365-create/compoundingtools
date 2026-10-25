const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html'));
test.beforeEach(async({page})=>{await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());});
test('every page has seven real categories and no horizontal overflow',async({page})=>{
 test.setTimeout(120000);
 for(const path of pages){
  await page.goto('/'+path);await expect(page.locator('#cyf-sidebar details')).toHaveCount(7);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);
  const inputs=page.locator('main input:not([type=hidden]),main select,main textarea');
  for(let i=0;i<await inputs.count();i++){
   const box=await inputs.nth(i).boundingBox();if(box)expect(box.x>=0&&box.x+box.width<=await page.evaluate(()=>innerWidth)+1,path+' input').toBe(true);
  }
 }
});
test('current tool is marked and category expanded',async({page})=>{
 await page.goto('/home-mortgage.html');
 await expect(page.locator('#cyf-sidebar a[aria-current=page]')).toHaveAttribute('href','home-mortgage.html');
 await expect(page.locator('#cyf-sidebar details').filter({has:page.locator('a[href="home-mortgage.html"]')})).toHaveAttribute('open','');
});
test('mobile drawer contains keyboard focus, cancels and restores scroll',async({page})=>{
 test.skip((page.viewportSize()).width>=1200,'drawer is mobile/tablet only');
 await page.goto('/index.html');await page.evaluate(()=>scrollTo(0,400));const y=await page.evaluate(()=>scrollY);
 const toggle=page.locator('#cyf-menu-toggle');await toggle.click();
 await expect(page.locator('#cyf-sidebar')).toHaveAttribute('aria-modal','true');
 await expect(page.locator('.cyf-menu-close')).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(page.locator('#cyf-sidebar a').last()).toBeFocused();
 await page.keyboard.press('Tab');await expect(page.locator('.cyf-menu-close')).toBeFocused();
 for(let i=0;i<35;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.querySelector('#cyf-sidebar').contains(document.activeElement))).toBe(true);}
 await page.keyboard.press('Escape');await expect(toggle).toBeFocused();await expect(toggle).toHaveAttribute('aria-expanded','false');
 expect(await page.evaluate(()=>scrollY)).toBe(y);expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
 await toggle.click();await page.locator('.cyf-menu-close').click();await expect(toggle).toBeFocused();
 await toggle.click();await page.locator('.cyf-nav-backdrop').click({position:{x:page.viewportSize().width-5,y:200}});await expect(toggle).toHaveAttribute('aria-expanded','false');
});
test('navigation, back and repeated open retain working document',async({page})=>{
 await page.goto('/index.html');const mobile=page.viewportSize().width<1200;
 if(mobile)await page.locator('#cyf-menu-toggle').click();
 await page.locator('#cyf-sidebar summary').filter({hasText:'Home & Big Purchases'}).click();
 await page.locator('#cyf-sidebar a[href="home-mortgage.html"]').click();await expect(page).toHaveURL(/home-mortgage.html$/);
 expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
 await page.goBack();await expect(page.locator('#cyf-menu-toggle')).toHaveAttribute('aria-expanded','false');
 if(mobile){await page.locator('#cyf-menu-toggle').click();await page.keyboard.press('Escape');await expect(page.locator('#cyf-menu-toggle')).toBeFocused();}
});
test('resizing open drawer releases modality',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/index.html');await page.locator('#cyf-menu-toggle').click();
 await page.setViewportSize({width:1365,height:900});await expect(page.locator('#cyf-sidebar')).not.toHaveAttribute('aria-modal','true');
 expect(await page.evaluate(()=>Array.from(document.body.children).filter(el=>el.id!=='cyf-navigation-shell').some(el=>el.inert))).toBe(false);
 await page.setViewportSize({width:390,height:844});await expect(page.locator('#cyf-menu-toggle')).toHaveAttribute('aria-expanded','false');
});
