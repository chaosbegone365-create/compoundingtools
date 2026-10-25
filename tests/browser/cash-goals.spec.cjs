const {test,expect}=require('@playwright/test');
let errors;
test.beforeEach(async({page,context})=>{
 errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort());
 await page.goto('/money-cash-goals.html');
});
test.afterEach(()=>expect(errors).toEqual([]));
test('default cash scenario separates reserve from goal',async({page})=>{
 await expect(page.locator('#goal-balance')).toHaveText('$9,600.00');
 await expect(page.locator('#cash-status')).toContainText('goal shortfall $400.00; reserve shortfall $0.00');
 await expect(page.locator('#cash-rows tr')).toHaveCount(13);
 await expect(page.locator('#cash-stress')).toContainText('Skipped');
});
test('reserve shortfall takes contributions first and 0 months means due now',async({page})=>{
 await page.locator('#cash').fill('8000');
 await expect(page.locator('#goal-balance')).toHaveText('$2,600.00');
 await expect(page.locator('#cash-rows tr').nth(4)).toContainText('$100.00');
 await page.locator('#months').fill('0');
 await expect(page.locator('#cash-status')).toContainText('goal shortfall $10,000.00; reserve shortfall $1,000.00');
 await expect(page.locator('#cash-rows tr')).toHaveCount(1);
});
test('effective APY, separate 100% loss, and reset',async({page})=>{
 await page.locator('#reserveMonths').fill('0');await page.locator('#cash').fill('1000');
 await page.locator('#contribution').fill('0');await page.locator('#apy').fill('4');
 await expect(page.locator('#goal-balance')).toHaveText('$1,040.00');
 await page.locator('#stressAmount').fill('500');await page.locator('#downside').fill('100');
 await expect(page.locator('#cash-stress')).toContainText('loses $500.00, leaving $0.00');
 await expect(page.locator('#goal-balance')).toHaveText('$1,040.00');
 await page.getByRole('button',{name:'Reset example'}).click();
 await expect(page.locator('#goal-balance')).toHaveText('$9,600.00');
 await expect(page.locator('#cash-stress')).toContainText('Skipped');
});
test('invalid edits clear stale results and recover repeatedly',async({page})=>{
 for(const [id,bad,valid] of [['cash','','15000'],['months','1.5','12'],['apy','26','0'],['downside','101','20'],['expenses','-1','3000']]){
   await page.locator('#'+id).fill(bad);
   await expect(page.locator('#cash-results')).toBeHidden();
   await expect(page.locator('#cash-rows tr')).toHaveCount(0);
   await expect(page.locator('#cash-status')).not.toBeEmpty();
   await page.locator('#'+id).fill(valid);
   await expect(page.locator('#goal-balance')).toHaveText('$9,600.00');
 }
});
test('download contains inputs and table; no input URL or storage persistence',async({page})=>{
 const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Download scenario CSV'}).click();
 const download=await wait;expect(download.suggestedFilename()).toBe('cash-reserve-goal-scenario.csv');
 const stream=await download.createReadStream();const buffers=[];for await(const chunk of stream) buffers.push(chunk);
 const text=Buffer.concat(buffers).toString();expect(text).toContain('"Current cash","15000"');expect(text).toContain('"12","0.00","300.00","0.00","9000.00","9600.00"');
 expect(new URL(page.url()).search).toBe('');
 expect(await page.evaluate(()=>[localStorage.length,sessionStorage.length])).toEqual([0,0]);
 await page.locator('#cash').fill('12345');await page.reload();await expect(page.locator('#cash')).toHaveValue('15000');
});
test('labels, keyboard submit, mobile containment and scrollable table',async({page})=>{
 await expect(page.getByLabel('Current cash ($)',{exact:true})).toBeVisible();
 await page.locator('#cash').focus();await page.keyboard.press('Enter');await expect(page.locator('#goal-balance')).toHaveText('$9,600.00');
 const widths=await page.evaluate(()=>({page:document.documentElement.scrollWidth,view:window.innerWidth}));
 expect(widths.page).toBeLessThanOrEqual(widths.view+1);
 for(const input of await page.locator('#cash-goal-form input').all()){
   const box=await input.boundingBox();expect(box.width).toBeGreaterThan(30);expect(box.x+box.width).toBeLessThanOrEqual(widths.view+1);
 }
 await expect(page.getByRole('region',{name:'Monthly cash projection, scroll horizontally on small screens'})).toHaveAttribute('tabindex','0');
});
