const {test,expect}=require('@playwright/test');
const ORIGIN='http://127.0.0.1:4173';
test.beforeEach(async({page})=>{await page.route('**/*',route=>route.request().url().startsWith(ORIGIN)?route.continue():route.abort());await page.goto('/family-school-costs.html');});
test('school example, live change, invalid-state clearing and reset',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.locator('#status')).toContainText('$75,589.73');
 await expect(page.locator('#results tbody').first().locator('tr').first()).toContainText('$14,400.00');
 await expect(page.locator('#results tbody').first().locator('tr').first()).toContainText('$36,600.00');
 await page.locator('#s1-c1-discount').fill('0');await expect(page.locator('#results tbody').first().locator('tr').first()).toContainText('$37,600.00');
 await page.locator('#s0-c0-tuition').fill('');await expect(page.locator('#status')).toContainText('enter a number');await expect(page.locator('#results')).toBeEmpty();await expect(page.locator('#download')).toBeDisabled();
 await page.locator('#reset').click();await expect(page.locator('#download')).toBeEnabled();await expect(page.locator('#s1-c1-discount')).toHaveValue('1000');
 await page.locator('#s1-c0-aid').fill('16000');await expect(page.locator('#status')).toContainText('cannot exceed');await expect(page.locator('#results')).toBeEmpty();
 await page.locator('#reset').click();expect(errors).toEqual([]);
});
test('school child controls preserve edits, cap count, and reset',async({page})=>{
 await page.locator('#s0-c0-fees').fill('123');for(let i=0;i<4;i++)await page.locator('#add-child').click();await expect(page.locator('#children-0 fieldset')).toHaveCount(6);await expect(page.locator('#children-1 fieldset')).toHaveCount(6);await expect(page.locator('#add-child')).toBeDisabled();await expect(page.locator('#s0-c0-fees')).toHaveValue('123');
 for(let i=0;i<5;i++)await page.locator('#remove-child').click();await expect(page.locator('#children-0 fieldset')).toHaveCount(1);await expect(page.locator('#remove-child')).toBeDisabled();
 await page.locator('#reset').click();await expect(page.locator('#children-0 fieldset')).toHaveCount(2);await expect(page.locator('#s0-c0-fees')).toHaveValue('300');
});
test('school zero enrollment years and negative difference are explicit',async({page})=>{
 await page.locator('#years').fill('1');await page.locator('#s1-c0-start').fill('2');await page.locator('#s1-c1-start').fill('2');await expect(page.locator('#status')).toContainText('private $0.00');await expect(page.locator('#status')).toContainText('-$14,400.00');
 await page.locator('#years').fill('1.5');await expect(page.locator('#status')).toContainText('whole number');await expect(page.locator('#results')).toBeEmpty();
});
test('school CSV exports numeric inputs and results without URL persistence',async({page})=>{
 await page.locator('#s0-c0-fees').fill('321');const pending=page.waitForEvent('download');await page.locator('#download').click();const file=await pending;expect(file.suggestedFilename()).toBe('school-cost-comparison.csv');const stream=await file.createReadStream();let csv='';for await(const data of stream)csv+=data.toString();expect(csv).toContain('"fees","321"');expect(csv).toContain('"Private minus public"');expect(page.url()).toBe(ORIGIN+'/family-school-costs.html');await page.reload();await expect(page.locator('#s0-c0-fees')).toHaveValue('300');
});
test('school layout, semantic labels and actual keyboard access',async({page})=>{
 const dimensions=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,width:document.documentElement.scrollWidth}));expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport+1);
 const escaped=await page.locator('.fields label').evaluateAll(labels=>labels.filter(label=>{const a=label.getBoundingClientRect(),b=label.querySelector('input').getBoundingClientRect();return b.left<a.left-1||b.right>a.right+1}).length);expect(escaped).toBe(0);
 const unlabeled=await page.locator('input').evaluateAll(inputs=>inputs.filter(i=>!i.labels?.length && !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby')).length);expect(unlabeled).toBe(0);
 const needed=new Set(['years','add-child','remove-child','s0-growth','s0-c0-tuition','reset','download']);
 const tabBound=await page.locator('a[href],button,input,select,textarea,summary,[tabindex]').count()+10;
 for(let i=0;i<tabBound&&needed.size;i++){
  await page.keyboard.press('Tab');
  const id=await page.evaluate(()=>document.activeElement.id);
  if(!needed.has(id))continue;
  const control=page.locator('#'+id);
  await expect(control).toBeFocused();
  // Native Tab scrolling inherits the site's smooth-scroll behavior. Retry the
  // same viewport conditions until scrolling settles; never force a scroll.
  await expect.poll(async()=>control.evaluate(el=>{
   const r=el.getBoundingClientRect();
   return {focused:el===document.activeElement,bottomVisible:r.bottom>0,
    topVisible:r.top<innerHeight,rightVisible:r.right>0,leftVisible:r.left<innerWidth};
  }),{message:'Keyboard focus must reach visible control #'+id,timeout:5000}).toEqual({
   focused:true,bottomVisible:true,topVisible:true,rightVisible:true,leftVisible:true
  });
  needed.delete(id);
 }
 expect([...needed]).toEqual([]);
});
