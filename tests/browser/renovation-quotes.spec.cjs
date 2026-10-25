/* Prepared for the parent's existing loopback-only Playwright CI; never launch locally here. */
const {test,expect}=require('@playwright/test');
let errors;
test.beforeEach(async({page,context})=>{
 errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort());
 await page.goto('/home-renovation-quotes.html');
});
test.afterEach(()=>expect(errors).toEqual([]));
const card=(page,id)=>page.locator('[data-quote="'+id+'"]');
test('30000 cap excludes higher-scoring quote while ranking affordable preferences',async({page})=>{
 await expect(card(page,'a').locator('.quote-total')).toHaveText('$25,753.20');
 await expect(card(page,'b').locator('.quote-total')).toHaveText('$29,554.80');
 await expect(card(page,'c').locator('.quote-total')).toHaveText('$35,807.20');
 await expect(page.locator('#quote-outcome')).toContainText('B · Option B');
 await expect(card(page,'c').locator('.quote-fit')).toContainText('$5,807.20 over');
 await expect(card(page,'c').locator('.quote-score')).toContainText('7.80/10 · not eligible');
 await expect(page.locator('#cheaper-options')).toContainText('$3,801.60 less');
 await expect(page.locator('#quote-rows tr')).toHaveCount(17);
 await expect(page.locator('#quote-next-steps')).toContainText('Aesthetics is a high priority');
 await expect(page.locator('#quote-next-steps')).toContainText('Durability / longevity is a high priority');
});
test('importance edits change rank and next steps without changing budget or quotes',async({page})=>{
 await page.locator('#weight-aesthetics').fill('10');await page.locator('#weight-durability').fill('0');await page.locator('#weight-maintenance').fill('0');
 await expect(page.locator('#quote-outcome')).toContainText('A · Option A');
 await expect(page.locator('#quote-next-steps')).not.toContainText('Durability / longevity is a high priority');
 await expect(page.locator('#budget')).toHaveValue('30000');await expect(page.locator('#a-quantity')).toHaveValue('800');
 await expect(card(page,'b').locator('.quote-total')).toHaveText('$29,554.80');
 await page.locator('#weight-aesthetics').fill('0');await page.locator('#weight-maintenance').fill('10');
 await expect(page.locator('#quote-outcome')).toContainText('B · Option B');
 await expect(page.locator('#quote-next-steps')).toContainText('Ease of maintenance is a high priority');
});
test('exact ties and zero importance have explicit non-winner outcomes',async({page})=>{
 for(const p of ['a','b'])for(const k of ['aesthetics','durability','maintenance'])await page.locator('#'+p+'-'+k).fill('7');
 await expect(page.locator('#quote-outcome')).toContainText('Preference tie within budget');
 await expect(card(page,'a').locator('.quote-score')).toContainText('affordable rank 1');await expect(card(page,'b').locator('.quote-score')).toContainText('affordable rank 1');
 for(const k of ['aesthetics','durability','maintenance'])await page.locator('#weight-'+k).fill('0');
 await expect(page.locator('#quote-outcome')).toContainText('all importance weights are zero');
 await expect(card(page,'a').locator('.quote-score')).toHaveText('Preference fit: not scored.');
 await expect(page.locator('#cheaper-options')).toContainText('Cost order only');
});
test('all quotes over budget keeps hard cap and offers no-purchase route',async({page})=>{
 await page.locator('#budget').fill('25000');
 await expect(page.locator('#quote-outcome')).toHaveText('No entered quote fits the hard cap.');
 await expect(page.locator('#quote-next-steps')).toContainText('Keep the budget unchanged');
 await expect(page.locator('#cheaper-options')).toContainText('still $753.20 over budget');
 await expect(page.locator('#budget')).toHaveValue('25000');
 await expect(page.getByRole('heading',{name:'No new purchase is a valid route'})).toBeVisible();
 await page.locator('#budget').fill('6000');await expect(page.locator('#reserve-floor')).toContainText('reserve alone exceeds the hard cap');
 await expect(page.locator('#reserve-floor')).toContainText('not the cost of canceling');
});
test('one-cent affordability boundary and fractional material rounding are exact',async({page})=>{
 await page.locator('#budget').fill('29554.80');await expect(card(page,'b').locator('.quote-fit')).toContainText('Within your cap by $0.00');
 await page.locator('#budget').fill('29554.79');await expect(card(page,'b').locator('.quote-fit')).toContainText('$0.01 over');
 await page.locator('#otherCosts').fill('0');await page.locator('#contingency').fill('50');
 for(const k of ['labor','removal','extras','tax'])await page.locator('#a-'+k).fill('0');
 await page.locator('#a-quantity').fill('0.01');await page.locator('#a-unitPrice').fill('0.50');
 await expect(card(page,'a').locator('.quote-total')).toHaveText('$0.02');
});
test('invalid and incomplete edits hide stale output, focus first error, then recover',async({page})=>{
 for(const [id,value] of [['budget',''],['a-name',''],['b-unit',' '],['a-labor','-1'],['a-quantity','0.001'],['weight-aesthetics','1.5'],['b-durability','10.00000000000000001'],['contingency','100.01'],['c-unitPrice','1000001']]){
  const old=await page.locator('#'+id).inputValue();await page.locator('#'+id).fill(value);
  await expect(page.locator('#renovation-results')).toBeHidden();await expect(page.locator('#'+id)).toHaveAttribute('aria-invalid','true');await expect(page.locator('#quote-rows tr')).toHaveCount(0);
  await page.locator('#'+id).fill(old);await expect(page.locator('#renovation-results')).toBeVisible();
 }
 await page.locator('#budget').fill('');await page.getByRole('button',{name:'Compare quotes',exact:true}).click();await expect(page.locator('#budget')).toBeFocused();
});
test('repeated compare and reset clear invalid states without duplicate result rows',async({page})=>{
 await page.locator('#budget').fill('');await page.getByRole('button',{name:'Reset fictional examples'}).click();
 await expect(page.locator('#budget')).toHaveValue('30000');await expect(page.locator('#budget')).not.toHaveAttribute('aria-invalid','true');
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Compare quotes',exact:true}).click();
 await expect(page.locator('#quote-rows tr')).toHaveCount(17);await expect(page.locator('#quote-summaries article')).toHaveCount(3);
 await page.locator('#weight-durability').fill('0');await page.locator('#b-name').fill('Changed');await page.getByRole('button',{name:'Reset fictional examples'}).click();
 await expect(page.locator('#weight-durability')).toHaveValue('8');await expect(page.locator('#b-name')).toHaveValue('Option B (example)');
 await expect(page.locator('#quote-outcome')).toContainText('B · Option B');
});
test('labels render as text and CSV sanitizes formula-prefixed labels with no persistence',async({page})=>{
 await page.locator('#a-name').fill('<img src=x onerror=alert(1)>');
 await expect(card(page,'a').locator('h3')).toHaveText('A · <img src=x onerror=alert(1)>');await expect(page.locator('#quote-summaries img')).toHaveCount(0);
 await page.locator('#b-name').fill('=HYPERLINK("https://example.invalid")');
 const promise=page.waitForEvent('download');await page.locator('#renovation-export').click();const download=await promise;
 expect(download.suggestedFilename()).toBe('renovation-quote-comparison.csv');let csv='';for await(const chunk of await download.createReadStream())csv+=chunk.toString();
 expect(csv).toContain('"\'=HYPERLINK(""https://example.invalid"")"');expect(csv).toContain('"total USD","25753.20","29554.80","35807.20"');expect(csv).toContain('"Hard project cap USD","30000.00"');
 expect(new URL(page.url()).search).toBe('');expect(new URL(page.url()).hash).toBe('');expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
});
test('long allowed labels wrap, controls fit, keyboard order and draft restrictions remain',async({page})=>{
 await page.locator('#b-name').fill('X'.repeat(80));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 for(const id of ['budget','otherCosts','weight-durability','a-quantity','b-name','c-maintenance']){const box=await page.locator('#'+id).boundingBox();expect(box.width).toBeGreaterThan(60);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));}
 await page.locator('#budget').focus();await page.keyboard.press('Tab');await expect(page.locator('#otherCosts')).toBeFocused();
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
 await expect(page.getByText('There are no purchase or affiliate links in this calculator.',{exact:false})).toBeVisible();
 await expect(page.locator('.renovation-quotes a[href^="http"]')).toHaveCount(0);
});
test('page sharing is gesture-only, excludes inputs, and cancellation preserves form',async({page})=>{
 await page.evaluate(()=>{window.shared=[];Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>window.shared.push(payload)});history.replaceState({},'', '/home-renovation-quotes.html?budget=98765#private');});
 await page.locator('#budget').fill('98765');await page.locator('#b-name').fill('Private quote');expect(await page.evaluate(()=>window.shared)).toEqual([]);
 await page.locator('[data-share-tool]').click();const shared=await page.evaluate(()=>window.shared);expect(shared).toHaveLength(1);expect(shared[0].url).toBe('https://compoundyourfuture.com/home-renovation-quotes.html');expect(JSON.stringify(shared)).not.toContain('98765');expect(JSON.stringify(shared)).not.toContain('Private quote');
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Canceled','AbortError')}}));
 await page.locator('[data-share-tool]').click();await expect(page.locator('[data-share-status]')).toContainText('canceled');await expect(page.locator('#budget')).toHaveValue('98765');await expect(page.locator('#b-name')).toHaveValue('Private quote');
});
test('after parent integration, search and Home hub reach the draft with current navigation',async({page})=>{
 await page.goto('/');await page.locator('#site-search').fill('renovation quote');
 const link=page.locator('#tool-search-results a[href="home-renovation-quotes.html"]');await expect(link).toBeVisible();await link.click();
 await expect(page).toHaveURL(/home-renovation-quotes\.html$/);await expect(page.locator('#quote-outcome')).toContainText('B · Option B');
 await expect(page.locator('#cyf-sidebar a[aria-current="page"]')).toHaveAttribute('href','home-renovation-quotes.html');
 await expect(page.locator('#cyf-sidebar details').filter({has:page.locator('a[href="home-renovation-quotes.html"]')})).toHaveAttribute('open','');
 await page.goBack();await expect(page).toHaveURL(/\/$/);await page.goForward();await expect(page).toHaveURL(/home-renovation-quotes\.html$/);await expect(page.locator('#renovation-results')).toBeVisible();
 await page.goto('/home.html');await page.locator('a.tile[href="home-renovation-quotes.html"]').click();await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex,follow');
});
