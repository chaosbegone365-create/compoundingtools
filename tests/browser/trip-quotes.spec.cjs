const {test,expect}=require('@playwright/test');
let errors;
test.beforeEach(async({page,context})=>{
 errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort());
 await page.goto('/travel-quote-tradeoffs.html');
});
test.afterEach(()=>expect(errors).toEqual([]));
test('4000 hard-cap example exposes cheaper-flight extra-night tradeoff',async({page})=>{
 await expect(page.locator('#a-total')).toHaveText('$4,312.00');
 await expect(page.locator('#b-total')).toHaveText('$4,378.00');
 await expect(page.locator('#a-fit')).toContainText('Over the hard cap by $312.00');
 await expect(page.locator('#trip-difference')).toContainText('B is $66.00 more');
 await expect(page.locator('#flight-tradeoff')).toContainText('saves $300.00');
 await expect(page.locator('#extra-night')).toContainText('$396.00');
 await expect(page.locator('#airfare-ceilings')).toContainText('$1,116.36');
 await expect(page.locator('#trip-rows tr')).toHaveCount(9);
});
test('shorter alternative requires choice, changes B not constraints or original',async({page})=>{
 await expect(page.locator('#b-nights')).toHaveValue('7');
 await page.locator('#shorter-trip').click();
 await expect(page.locator('#b-nights')).toHaveValue('5');
 await expect(page.locator('#a-nights')).toHaveValue('6');
 await expect(page.locator('#budget')).toHaveValue('4000');
 await expect(page.locator('#party')).toHaveValue('4');
 await expect(page.locator('#a-total')).toHaveText('$4,312.00');
 await expect(page.locator('#b-total')).toHaveText('$3,916.00');
 await expect(page.locator('#b-fit')).toContainText('Within the entered cap by $84.00');
 await expect(page.locator('#alternative-note')).toContainText('You chose a hypothetical shorter alternative');
 await page.locator('#b-airfare').fill('1200');
 await expect(page.locator('#alternative-note')).not.toContainText('You chose');
});
test('empty negative fractional and overflow inputs hide stale results then recover',async({page})=>{
 for(const [id,value] of [['budget',''],['a-airfare','-1'],['party','1.5'],['party','1.00000000000000001'],['a-nights','365.00000000000000001'],['b-nights','366'],['contingency','100.01'],['b-daily','1.001'],['budget','100000001']]){
  const old=await page.locator('#'+id).inputValue();await page.locator('#'+id).fill(value);
  await expect(page.locator('#trip-results')).toBeHidden();await expect(page.locator('#'+id)).toHaveAttribute('aria-invalid','true');
  await page.locator('#'+id).fill(old);await expect(page.locator('#trip-results')).toBeVisible();
 }
 await page.locator('#budget').fill('');await page.getByRole('button',{name:'Compare scenarios',exact:true}).click();await expect(page.locator('#budget')).toBeFocused();
});
test('zero-night day trip disables shortening and impossible non-airfare cap is explicit',async({page})=>{
 await page.locator('#a-nights').fill('0');await expect(page.locator('#shorter-trip')).toBeDisabled();
 await expect(page.locator('#original-constraints')).toContainText('A remains 0 nights / 1 allowance days');
 await page.locator('#budget').fill('1');await expect(page.locator('#airfare-ceilings')).toContainText('No nonnegative transport price fits');
});
test('reset restores fictional data and clears alternate selection',async({page})=>{
 await page.locator('#shorter-trip').click();await page.locator('#budget').fill('6000');
 await page.getByRole('button',{name:'Reset fictional examples'}).click();
 await expect(page.locator('#budget')).toHaveValue('4000');await expect(page.locator('#b-nights')).toHaveValue('7');await expect(page.locator('#a-total')).toHaveText('$4,312.00');
 await expect(page.locator('#alternative-note')).not.toContainText('You chose');
});
test('CSV has explicit inputs and computed totals and does not change URL or storage',async({page})=>{
 await page.locator('#shorter-trip').click();
 const downloadPromise=page.waitForEvent('download');await page.locator('#trip-export').click();const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('trip-quote-comparison.csv');const stream=await download.createReadStream();let body='';for await(const chunk of stream)body+=chunk.toString();
 expect(body).toContain('"nights","6","5"');expect(body).toContain('"total USD","4312.00","3916.00"');expect(body).toContain('"Duration alternative explicitly selected","Yes"');
 expect(new URL(page.url()).search).toBe('');expect(new URL(page.url()).hash).toBe('');
 expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
});
test('optional exact affiliate link is disclosed, never exercised, and responsive controls fit',async({page})=>{
 const link=page.getByRole('link',{name:'Open Expedia to check quotes (affiliate link)'});await expect(link).toHaveAttribute('href','https://expedia.com/affiliate/3DafBAM');await expect(link).toHaveAttribute('rel',/sponsored/);
 await expect(page.getByText('Your budget, dates, party size and calculator inputs are not transferred.',{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 for(const id of ['party','budget','a-nights','b-extras']){const box=await page.locator('#'+id).boundingBox();expect(box.width).toBeGreaterThan(60);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));}
 await page.locator('#party').focus();await page.keyboard.press('Tab');await expect(page.locator('#budget')).toBeFocused();
});

test('draft quote comparison is reachable from search and the Vacations hub',async({page})=>{
 await page.goto('/');await page.locator('#site-search').fill('trip quotes');
 const result=page.locator('#tool-search-results a').first();await expect(result).toHaveAttribute('href','travel-quote-tradeoffs.html');
 await result.click();await expect(page).toHaveURL(/travel-quote-tradeoffs\.html$/);
 await expect(page.getByText('Draft calculator. Fictional examples, not available offers.',{exact:true})).toBeVisible();
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
 await expect(page.locator('#cyf-sidebar a[aria-current="page"]')).toHaveAttribute('href','travel-quote-tradeoffs.html');
 await expect(page.locator('#cyf-sidebar details').filter({has:page.locator('a[href="travel-quote-tradeoffs.html"]')})).toHaveAttribute('open','');
 await page.goBack();await expect(page).toHaveURL(/\/$/);
 await page.goto('/travel.html');await page.locator('a.tile[href="travel-quote-tradeoffs.html"]').click();
 await expect(page.locator('#a-total')).toHaveText('$4,312.00');
});
test('trip sharing is gesture-only and passes the clean page address without quote inputs',async({page})=>{
 await page.evaluate(()=>{window.shared=[];Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>window.shared.push(payload)});history.replaceState({},'', '/travel-quote-tradeoffs.html?budget=98765#private');});
 await page.locator('#budget').fill('98765');await page.locator('#shorter-trip').click();
 expect(await page.evaluate(()=>window.shared)).toEqual([]);
 await page.locator('[data-share-tool]').click();
 const shared=await page.evaluate(()=>window.shared);
 expect(shared).toHaveLength(1);expect(shared[0].url).toBe('https://compoundyourfuture.com/travel-quote-tradeoffs.html');
 expect(JSON.stringify(shared)).not.toContain('98765');expect(JSON.stringify(shared)).not.toContain('private');
});
test('trip share cancellation leaves quote inputs alone and manual fallback is copyable',async({page})=>{
 await page.locator('#budget').fill('5432');
 await page.evaluate(()=>{window.copies=[];Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Canceled','AbortError')}});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copies.push(text)}});});
 await page.locator('[data-share-tool]').click();await expect(page.locator('[data-share-status]')).toContainText('canceled');
 expect(await page.evaluate(()=>window.copies)).toEqual([]);await expect(page.locator('#budget')).toHaveValue('5432');
 await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});});
 await page.locator('[data-share-tool]').click();await expect(page.locator('[data-share-link]')).toHaveValue('https://compoundyourfuture.com/travel-quote-tradeoffs.html');
 await expect(page.locator('[data-share-link]')).toBeFocused();await expect(page.locator('#budget')).toHaveValue('5432');
});
