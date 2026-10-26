const {test,expect}=require('@playwright/test');
const ORIGIN='http://127.0.0.1:4173';
// Synthetic one-pixel image tests rendering plumbing, not the real photo or rights.
const PIXEL=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64');
for(const available of [true,false])test('editorial photo layout and tools remain usable when image '+(available?'loads via synthetic fixture':'is unavailable'),async({page})=>{
 const images=[];
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===ORIGIN)return route.continue();
  if(url.hostname==='images.unsplash.com' && url.pathname==='/photo-1473496169904-658ba7c44d8a' && url.searchParams.get('w')==='1200'){
   images.push(route.request());return available?route.fulfill({contentType:'image/png',body:PIXEL}):route.abort();
  }
  return route.abort();
 });
 await page.goto('/');
 await expect(page.locator('#site-search')).toBeVisible();
 await expect(page.locator('#preview-value')).not.toBeEmpty();
 const band=page.locator('.cyf-life-context'),img=band.locator('img');
 await expect(band).toHaveCount(1);await expect(img).toHaveCount(1);
 await expect(img).toHaveAttribute('alt',/\S.{10,}/);
 await expect(img).toHaveAttribute('loading','lazy');
 await expect(img).toHaveAttribute('referrerpolicy','no-referrer');
 await expect(band.locator('figcaption')).toHaveText('Illustrative photo, not a customer testimonial.');
 await img.scrollIntoViewIfNeeded();
 if(available)await expect.poll(()=>img.evaluate(i=>i.complete && i.naturalWidth>0)).toBe(true);
 else await expect.poll(()=>img.evaluate(i=>i.complete)).toBe(true);
 const chosen=await img.evaluate(i=>i.currentSrc||i.src);expect(new URL(chosen).hostname).toBe('images.unsplash.com');
 await expect.poll(()=>images.length).toBe(1);
 expect(images[0].headers().referer).toBeUndefined();
 const geometry=await img.evaluate(i=>({image:i.getBoundingClientRect().toJSON(),parent:i.closest('figure').getBoundingClientRect().toJSON(),viewport:innerWidth}));
 expect(geometry.image.width).toBeLessThanOrEqual(geometry.parent.width+1);
 expect(geometry.image.right).toBeLessThanOrEqual(geometry.viewport+1);
 expect(geometry.image.height).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
